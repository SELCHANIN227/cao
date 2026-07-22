package main

import (
	"bufio"
	"bytes"
	"crypto/rand"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/tls"
	"encoding/base64"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"encoding/xml"
	"errors"
	"flag"
	"fmt"
	"io"
	"net"
	"net/textproto"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

const (
	speechHost      = "speech.platform.bing.com"
	trustedToken    = "6A5AA1D4EAFF4E9FB37E23D68491D6F4"
	chromiumVersion = "143.0.3650.75"
	extensionOrigin = "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold"
	audioOutput     = "audio-24khz-48kbitrate-mono-mp3"
)

type manifestFile struct {
	Version  int               `json:"version"`
	Language string            `json:"language"`
	Voices   map[string]string `json:"voices"`
	Texts    map[string]string `json:"texts"`
}

type voiceCandidate struct {
	VoiceName string
	Locale    string
}

type voicePack struct {
	ID          string
	DisplayName string
	VoiceName   string
	Locale      string
	Rate        string
	Pitch       string
	Candidates  []voiceCandidate
}

// Папки сохранены под старыми ID, чтобы обновление не ломало приложение.
// Сам генератор теперь сначала использует настоящие сербские нейроголоса.
var packs = []voicePack{
	{
		ID:          "gabrijela",
		DisplayName: "София — мягкий женский сербский",
		Rate:        "-10%",
		Pitch:       "+2Hz",
		Candidates: []voiceCandidate{
			{VoiceName: "sr-Latn-RS-SophieNeural", Locale: "sr-Latn-RS"},
			{VoiceName: "sr-RS-SophieNeural", Locale: "sr-RS"},
			{VoiceName: "hr-HR-GabrijelaNeural", Locale: "hr-HR"},
		},
	},
	{
		ID:          "srecko",
		DisplayName: "Никола — спокойный мужской сербский",
		Rate:        "-8%",
		Pitch:       "+1Hz",
		Candidates: []voiceCandidate{
			{VoiceName: "sr-Latn-RS-NicholasNeural", Locale: "sr-Latn-RS"},
			{VoiceName: "sr-RS-NicholasNeural", Locale: "sr-RS"},
			{VoiceName: "hr-HR-SreckoNeural", Locale: "hr-HR"},
		},
	},
}

type job struct {
	Pack voicePack
	Text string
	Key  string
	Path string
}

type result struct {
	Job     job
	Skipped bool
	Err     error
}

func main() {
	voiceFlag := flag.String("voice", "all", "all, gabrijela или srecko")
	limitFlag := flag.Int("limit", 0, "сгенерировать только первые N реплик")
	workersFlag := flag.Int("workers", 1, "количество параллельных запросов (1-2)")
	overwriteFlag := flag.Bool("overwrite", false, "перезаписать существующие MP3")
	flag.Parse()

	root, err := projectRoot()
	if err != nil {
		fatal(err)
	}

	manifestPath := filepath.Join(root, "audio-manifest.json")
	manifest, err := loadManifest(manifestPath)
	if err != nil {
		fatal(err)
	}

	selected, err := selectPacks(*voiceFlag)
	if err != nil {
		fatal(err)
	}

	fmt.Println("Проверяю доступность голосов перед большой генерацией…")
	selected, err = resolvePacks(selected)
	if err != nil {
		fatal(err)
	}
	fmt.Println()

	texts := sortedTexts(manifest.Texts)
	if *limitFlag > 0 && *limitFlag < len(texts) {
		texts = texts[:*limitFlag]
	}

	workers := *workersFlag
	if workers < 1 {
		workers = 1
	}
	if workers > 2 {
		workers = 2
	}

	fmt.Println("Ćao! v3.2 — генератор офлайн-озвучки без Azure-ключа")
	fmt.Printf("Реплик: %d · голосов: %d · файлов максимум: %d\n", len(texts), len(selected), len(texts)*len(selected))
	fmt.Println("Голоса:")
	for _, pack := range selected {
		fmt.Printf("  • %s\n", pack.DisplayName)
	}
	fmt.Println()

	jobs := make(chan job)
	results := make(chan result)
	var wg sync.WaitGroup

	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			for item := range jobs {
				if !*overwriteFlag {
					if info, statErr := os.Stat(item.Path); statErr == nil && info.Size() > 500 {
						results <- result{Job: item, Skipped: true}
						continue
					}
				}

				var audio []byte
				var synthErr error
				for attempt := 1; attempt <= 3; attempt++ {
					audio, synthErr = synthesize(item.Text, item.Pack)
					if synthErr == nil && len(audio) > 500 {
						break
					}
					if synthErr == nil {
						synthErr = fmt.Errorf("сервис вернул слишком короткий файл (%d байт)", len(audio))
					}
					time.Sleep(time.Duration(attempt) * 700 * time.Millisecond)
				}

				if synthErr == nil {
					if err := os.MkdirAll(filepath.Dir(item.Path), 0o755); err != nil {
						synthErr = err
					} else {
						tmp := item.Path + ".part"
						if err := os.WriteFile(tmp, audio, 0o644); err != nil {
							synthErr = err
						} else if err := os.Rename(tmp, item.Path); err != nil {
							synthErr = err
						}
					}
				}

				results <- result{Job: item, Err: synthErr}
				time.Sleep(320 * time.Millisecond)
			}
		}(i)
	}

	go func() {
		for _, pack := range selected {
			for _, pair := range texts {
				jobs <- job{
					Pack: pack,
					Text: pair.Text,
					Key:  pair.Key,
					Path: filepath.Join(root, "assets", "audio", pack.ID, pair.Key+".mp3"),
				}
			}
		}
		close(jobs)
		wg.Wait()
		close(results)
	}()

	total := len(texts) * len(selected)
	var processed, created, skipped, failed int64
	for res := range results {
		current := atomic.AddInt64(&processed, 1)
		switch {
		case res.Skipped:
			atomic.AddInt64(&skipped, 1)
		case res.Err != nil:
			atomic.AddInt64(&failed, 1)
			fmt.Printf("[%d/%d] ОШИБКА %s: %s — %v\n", current, total, res.Job.Pack.ID, truncate(res.Job.Text, 38), res.Err)
		default:
			atomic.AddInt64(&created, 1)
			fmt.Printf("[%d/%d] ✓ %s: %s\n", current, total, res.Job.Pack.ID, truncate(res.Job.Text, 54))
		}
	}

	fmt.Printf("\nГотово. Создано: %d · уже было: %d · ошибок: %d\n", created, skipped, failed)
	if failed > 0 {
		fmt.Println("Можно просто запустить генератор ещё раз: готовые файлы будут пропущены.")
		os.Exit(1)
	}

	// A short voice test must not make the launcher think that the complete
	// 255-file packs already exist. Completion markers are written only after
	// an unrestricted, error-free generation run.
	if *limitFlag == 0 {
		markerName := fmt.Sprintf(".complete-v%d-%d", manifest.Version, len(manifest.Texts))
		for _, pack := range selected {
			dir := filepath.Join(root, "assets", "audio", pack.ID)
			if err := os.MkdirAll(dir, 0o755); err != nil {
				fatal(err)
			}
			marker := filepath.Join(dir, markerName)
			content := fmt.Sprintf("voice=%s\nfiles=%d\ngenerated=%s\n", pack.VoiceName, len(manifest.Texts), time.Now().UTC().Format(time.RFC3339))
			if err := os.WriteFile(marker, []byte(content), 0o644); err != nil {
				fatal(err)
			}
		}
	}

	fmt.Println("Теперь открой start-windows.bat и выбери голос в разделе «Профиль».")
}

func resolvePacks(selected []voicePack) ([]voicePack, error) {
	resolved := make([]voicePack, 0, len(selected))
	for _, pack := range selected {
		working, err := resolvePack(pack)
		if err != nil {
			return nil, err
		}
		resolved = append(resolved, working)
	}
	return resolved, nil
}

func resolvePack(pack voicePack) (voicePack, error) {
	var failures []string
	for _, candidate := range pack.Candidates {
		trial := pack
		trial.VoiceName = candidate.VoiceName
		trial.Locale = candidate.Locale
		fmt.Printf("  • %s: %s … ", pack.ID, candidate.VoiceName)
		audio, err := synthesize("Zdravo. Hvala.", trial)
		if err == nil && len(audio) > 500 {
			fmt.Println("работает")
			return trial, nil
		}
		if err == nil {
			err = fmt.Errorf("слишком короткий ответ: %d байт", len(audio))
		}
		fmt.Println("не подошёл")
		failures = append(failures, candidate.VoiceName+": "+err.Error())
		time.Sleep(800 * time.Millisecond)
	}
	return voicePack{}, fmt.Errorf("не удалось подобрать голос для %s. Проверены варианты:\n  %s\nПроверь интернет, дату и время Windows, затем запусти генератор повторно", pack.DisplayName, strings.Join(failures, "\n  "))
}

type textPair struct {
	Text string
	Key  string
}

func sortedTexts(texts map[string]string) []textPair {
	pairs := make([]textPair, 0, len(texts))
	for text, key := range texts {
		pairs = append(pairs, textPair{Text: text, Key: key})
	}
	sort.Slice(pairs, func(i, j int) bool {
		if pairs[i].Key == pairs[j].Key {
			return pairs[i].Text < pairs[j].Text
		}
		return pairs[i].Key < pairs[j].Key
	})
	return pairs
}

func projectRoot() (string, error) {
	exe, err := os.Executable()
	if err == nil {
		dir := filepath.Dir(exe)
		if _, statErr := os.Stat(filepath.Join(dir, "audio-manifest.json")); statErr == nil {
			return dir, nil
		}
	}
	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	if _, statErr := os.Stat(filepath.Join(cwd, "audio-manifest.json")); statErr == nil {
		return cwd, nil
	}
	return "", errors.New("audio-manifest.json не найден рядом с генератором")
}

func loadManifest(path string) (manifestFile, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return manifestFile{}, fmt.Errorf("не удалось прочитать %s: %w", path, err)
	}
	var manifest manifestFile
	if err := json.Unmarshal(data, &manifest); err != nil {
		return manifestFile{}, fmt.Errorf("некорректный audio-manifest.json: %w", err)
	}
	if len(manifest.Texts) == 0 {
		return manifestFile{}, errors.New("в audio-manifest.json нет реплик")
	}
	return manifest, nil
}

func selectPacks(value string) ([]voicePack, error) {
	value = strings.ToLower(strings.TrimSpace(value))
	if value == "" || value == "all" {
		return packs, nil
	}
	for _, pack := range packs {
		if pack.ID == value {
			return []voicePack{pack}, nil
		}
	}
	return nil, fmt.Errorf("неизвестный голос %q: используй all, gabrijela или srecko", value)
}

func synthesize(text string, pack voicePack) ([]byte, error) {
	connID := randomHex(16, false)
	requestID := randomHex(16, false)
	gec := secMSGEC(time.Now().UTC())
	path := "/consumer/speech/synthesize/readaloud/edge/v1" +
		"?TrustedClientToken=" + trustedToken +
		"&ConnectionId=" + connID +
		"&Sec-MS-GEC=" + gec +
		"&Sec-MS-GEC-Version=1-" + chromiumVersion

	conn, reader, err := openWebSocket(path)
	if err != nil {
		return nil, err
	}
	defer conn.Close()

	config := "X-Timestamp:" + dateString(time.Now().UTC()) + "\r\n" +
		"Content-Type:application/json; charset=utf-8\r\n" +
		"Path:speech.config\r\n\r\n" +
		`{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"true","wordBoundaryEnabled":"false"},"outputFormat":"` + audioOutput + `"}}}}` + "\r\n"
	if err := writeFrame(conn, 0x1, []byte(config)); err != nil {
		return nil, fmt.Errorf("не удалось отправить настройки: %w", err)
	}

	escapedText := xmlEscape(text)
	ssml := "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>" +
		"<voice name='" + pack.VoiceName + "'>" +
		"<prosody pitch='" + pack.Pitch + "' rate='" + pack.Rate + "' volume='+0%'>" + escapedText + "</prosody>" +
		"</voice></speak>"
	request := "X-RequestId:" + requestID + "\r\n" +
		"Content-Type:application/ssml+xml\r\n" +
		"X-Timestamp:" + dateString(time.Now().UTC()) + "Z\r\n" +
		"Path:ssml\r\n\r\n" + ssml
	if err := writeFrame(conn, 0x1, []byte(request)); err != nil {
		return nil, fmt.Errorf("не удалось отправить текст: %w", err)
	}

	var audio bytes.Buffer
	var diagnostics []string
	conn.SetDeadline(time.Now().Add(65 * time.Second))
	for {
		opcode, payload, err := readMessage(conn, reader)
		if err != nil {
			return nil, fmt.Errorf("ошибка ответа TTS: %w", err)
		}
		switch opcode {
		case 0x1:
			headers, data := splitHeaders(payload)
			pathValue := strings.ToLower(headers.Get("Path"))
			if (pathValue == "response" || pathValue == "audio.metadata") && len(data) > 0 {
				clean := strings.TrimSpace(string(data))
				if clean != "" {
					diagnostics = append(diagnostics, truncate(clean, 180))
				}
			}
			if pathValue == "turn.end" {
				if audio.Len() == 0 {
					detail := ""
					if len(diagnostics) > 0 {
						detail = ": " + strings.Join(diagnostics, " | ")
					}
					return nil, errors.New("TTS завершился без аудио" + detail)
				}
				return audio.Bytes(), nil
			}
		case 0x2:
			if len(payload) < 2 {
				continue
			}
			headerLen := int(binary.BigEndian.Uint16(payload[:2]))
			if headerLen < 0 || 2+headerLen > len(payload) {
				continue
			}

			// In Microsoft Speech binary messages the two-byte prefix contains
			// the exact length of a header block. Unlike text messages, that
			// block commonly ends with a single CRLF rather than CRLFCRLF.
			// The old parser expected CRLFCRLF, returned no Path header and
			// silently discarded every audio chunk while still receiving
			// SentenceBoundary metadata.
			headerBytes := payload[2 : 2+headerLen]
			data := payload[2+headerLen:]
			headers := parseHeaderBlock(headerBytes)
			if strings.EqualFold(headers.Get("Path"), "audio") && len(data) > 0 {
				audio.Write(data)
			}
		case 0x8:
			return nil, errors.New("сервер закрыл соединение до окончания аудио")
		}
	}
}

func openWebSocket(path string) (net.Conn, *bufio.Reader, error) {
	dialer := &net.Dialer{Timeout: 20 * time.Second, KeepAlive: 20 * time.Second}
	raw, err := dialer.Dial("tcp", speechHost+":443")
	if err != nil {
		return nil, nil, fmt.Errorf("нет соединения с Microsoft Speech: %w", err)
	}

	tlsConn := tls.Client(raw, &tls.Config{ServerName: speechHost, MinVersion: tls.VersionTLS12})
	if err := tlsConn.Handshake(); err != nil {
		raw.Close()
		return nil, nil, fmt.Errorf("ошибка TLS: %w", err)
	}

	keyBytes := make([]byte, 16)
	if _, err := rand.Read(keyBytes); err != nil {
		tlsConn.Close()
		return nil, nil, err
	}
	wsKey := base64.StdEncoding.EncodeToString(keyBytes)
	muid := strings.ToUpper(randomHex(16, false))

	request := "GET " + path + " HTTP/1.1\r\n" +
		"Host: " + speechHost + "\r\n" +
		"Pragma: no-cache\r\n" +
		"Cache-Control: no-cache\r\n" +
		"User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/" + strings.Split(chromiumVersion, ".")[0] + ".0.0.0 Safari/537.36 Edg/" + strings.Split(chromiumVersion, ".")[0] + ".0.0.0\r\n" +
		"Upgrade: websocket\r\n" +
		"Origin: " + extensionOrigin + "\r\n" +
		"Sec-WebSocket-Version: 13\r\n" +
		"Accept-Encoding: gzip, deflate, br, zstd\r\n" +
		"Accept-Language: en-US,en;q=0.9\r\n" +
		"Sec-WebSocket-Key: " + wsKey + "\r\n" +
		"Connection: Upgrade\r\n" +
		"Cookie: muid=" + muid + ";\r\n\r\n"

	if _, err := io.WriteString(tlsConn, request); err != nil {
		tlsConn.Close()
		return nil, nil, err
	}

	reader := bufio.NewReader(tlsConn)
	statusLine, err := reader.ReadString('\n')
	if err != nil {
		tlsConn.Close()
		return nil, nil, err
	}
	parts := strings.Split(strings.TrimSpace(statusLine), " ")
	if len(parts) < 2 {
		tlsConn.Close()
		return nil, nil, fmt.Errorf("непонятный ответ сервера: %s", strings.TrimSpace(statusLine))
	}
	statusCode, _ := strconv.Atoi(parts[1])

	mimeReader := textproto.NewReader(reader)
	headers, err := mimeReader.ReadMIMEHeader()
	if err != nil {
		tlsConn.Close()
		return nil, nil, err
	}
	if statusCode != 101 {
		tlsConn.Close()
		return nil, nil, fmt.Errorf("Microsoft Speech отклонил соединение: HTTP %d", statusCode)
	}

	expected := websocketAccept(wsKey)
	if accept := headers.Get("Sec-WebSocket-Accept"); accept != "" && accept != expected {
		tlsConn.Close()
		return nil, nil, errors.New("сервер вернул неверный WebSocket handshake")
	}

	return tlsConn, reader, nil
}

func writeFrame(w io.Writer, opcode byte, payload []byte) error {
	var header bytes.Buffer
	header.WriteByte(0x80 | (opcode & 0x0F))
	payloadLen := len(payload)
	switch {
	case payloadLen < 126:
		header.WriteByte(0x80 | byte(payloadLen))
	case payloadLen <= 65535:
		header.WriteByte(0x80 | 126)
		var b [2]byte
		binary.BigEndian.PutUint16(b[:], uint16(payloadLen))
		header.Write(b[:])
	default:
		header.WriteByte(0x80 | 127)
		var b [8]byte
		binary.BigEndian.PutUint64(b[:], uint64(payloadLen))
		header.Write(b[:])
	}

	mask := make([]byte, 4)
	if _, err := rand.Read(mask); err != nil {
		return err
	}
	header.Write(mask)
	masked := make([]byte, payloadLen)
	for i := range payload {
		masked[i] = payload[i] ^ mask[i%4]
	}
	if _, err := w.Write(header.Bytes()); err != nil {
		return err
	}
	_, err := w.Write(masked)
	return err
}

func readMessage(conn net.Conn, reader *bufio.Reader) (byte, []byte, error) {
	var message bytes.Buffer
	var messageOpcode byte

	for {
		first, err := reader.ReadByte()
		if err != nil {
			return 0, nil, err
		}
		second, err := reader.ReadByte()
		if err != nil {
			return 0, nil, err
		}

		fin := first&0x80 != 0
		opcode := first & 0x0F
		masked := second&0x80 != 0
		length := uint64(second & 0x7F)
		switch length {
		case 126:
			var b [2]byte
			if _, err := io.ReadFull(reader, b[:]); err != nil {
				return 0, nil, err
			}
			length = uint64(binary.BigEndian.Uint16(b[:]))
		case 127:
			var b [8]byte
			if _, err := io.ReadFull(reader, b[:]); err != nil {
				return 0, nil, err
			}
			length = binary.BigEndian.Uint64(b[:])
		}
		if length > 64*1024*1024 {
			return 0, nil, errors.New("слишком большой WebSocket-фрейм")
		}

		var mask [4]byte
		if masked {
			if _, err := io.ReadFull(reader, mask[:]); err != nil {
				return 0, nil, err
			}
		}

		payload := make([]byte, int(length))
		if _, err := io.ReadFull(reader, payload); err != nil {
			return 0, nil, err
		}
		if masked {
			for i := range payload {
				payload[i] ^= mask[i%4]
			}
		}

		switch opcode {
		case 0x9:
			if err := writeFrame(conn, 0xA, payload); err != nil {
				return 0, nil, err
			}
			continue
		case 0xA:
			continue
		case 0x8:
			_ = writeFrame(conn, 0x8, payload)
			return 0x8, payload, nil
		case 0x0:
			if messageOpcode == 0 {
				return 0, nil, errors.New("неожиданный continuation-фрейм")
			}
			message.Write(payload)
		case 0x1, 0x2:
			messageOpcode = opcode
			message.Reset()
			message.Write(payload)
		default:
			continue
		}

		if fin {
			return messageOpcode, message.Bytes(), nil
		}
	}
}

func parseHeaderBlock(payload []byte) textproto.MIMEHeader {
	// Header blocks in binary Speech frames have a known byte length and do
	// not necessarily contain an empty line. Parse every CRLF-delimited line.
	payload = bytes.Trim(payload, "\x00\r\n \t")
	headers := make(textproto.MIMEHeader)
	for _, line := range bytes.Split(payload, []byte("\r\n")) {
		line = bytes.TrimSpace(line)
		if len(line) == 0 {
			continue
		}
		if colon := bytes.IndexByte(line, ':'); colon > 0 {
			key := textproto.CanonicalMIMEHeaderKey(strings.TrimSpace(string(line[:colon])))
			value := strings.TrimSpace(string(line[colon+1:]))
			headers.Add(key, value)
		}
	}
	return headers
}

func splitHeaders(payload []byte) (textproto.MIMEHeader, []byte) {
	index := bytes.Index(payload, []byte("\r\n\r\n"))
	if index < 0 {
		return textproto.MIMEHeader{}, payload
	}
	headerPart := string(payload[:index])
	headers := make(textproto.MIMEHeader)
	for _, line := range strings.Split(headerPart, "\r\n") {
		if colon := strings.IndexByte(line, ':'); colon > 0 {
			key := textproto.CanonicalMIMEHeaderKey(strings.TrimSpace(line[:colon]))
			value := strings.TrimSpace(line[colon+1:])
			headers.Add(key, value)
		}
	}
	return headers, payload[index+4:]
}

func secMSGEC(now time.Time) string {
	const windowsEpoch = int64(11644473600)
	unix := now.Unix()
	unix -= unix % 300
	ticks := (unix + windowsEpoch) * 10_000_000
	raw := strconv.FormatInt(ticks, 10) + trustedToken
	sum := sha256.Sum256([]byte(raw))
	return strings.ToUpper(hex.EncodeToString(sum[:]))
}

func dateString(t time.Time) string {
	return t.UTC().Format("Mon Jan 02 2006 15:04:05") + " GMT+0000 (Coordinated Universal Time)"
}

func randomHex(size int, uppercase bool) string {
	b := make([]byte, size)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	value := hex.EncodeToString(b)
	if uppercase {
		return strings.ToUpper(value)
	}
	return value
}

func websocketAccept(key string) string {
	sum := sha1.Sum([]byte(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"))
	return base64.StdEncoding.EncodeToString(sum[:])
}

func xmlEscape(value string) string {
	var buf bytes.Buffer
	_ = xml.EscapeText(&buf, []byte(value))
	return buf.String()
}

func truncate(value string, max int) string {
	runes := []rune(value)
	if len(runes) <= max {
		return value
	}
	return string(runes[:max-1]) + "…"
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, "Ошибка:", err)
	fmt.Println("Нажми Enter, чтобы закрыть окно.")
	_, _ = bufio.NewReader(os.Stdin).ReadString('\n')
	os.Exit(1)
}
