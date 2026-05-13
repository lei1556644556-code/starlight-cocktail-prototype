$ErrorActionPreference = "Stop"

$voiceDir = Join-Path (Get-Location) "assets\audio\voice"
New-Item -ItemType Directory -Force -Path $voiceDir | Out-Null

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 1
$synth.Volume = 95

$zhVoice = $synth.GetInstalledVoices() |
  Where-Object { $_.VoiceInfo.Culture.Name -like "zh-*" } |
  Select-Object -First 1
if ($zhVoice) {
  $synth.SelectVoice($zhVoice.VoiceInfo.Name)
}

function DecodeUtf8($base64) {
  return [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($base64))
}

$prompts = @(
  @{ File = "start.wav"; Text = DecodeUtf8 "5qyi6L+O5p2l5Yiw5pif5YWJ54m56LCD77yM5ouW5Yqo5omY55uY5byA5aeL6LCD5Yi25ZCn44CC" },
  @{ File = "restore.wav"; Text = DecodeUtf8 "5bey5oGi5aSN5LiK5qyh6L+b5bqm77yM57un57ut6LCD5Yi25ZCn44CC" },
  @{ File = "use-tool.wav"; Text = DecodeUtf8 "5qGM6Z2i5bey57uP5rKh5pyJ5L2N572u5LqG77yM6K+35L2/55So5Z6D5Zy+5qG25oiW5aS55a2Q5pWR5bGA44CC" },
  @{ File = "invalid.wav"; Text = DecodeUtf8 "6L+Z6YeM6L+Y5LiN6IO95pON5L2c77yM6K+35o2i5LiA5Liq5L2N572u44CC" },
  @{ File = "full-tray.wav"; Text = DecodeUtf8 "5ruh55uY5a6M5oiQ77yM6YWj55WF5YC85o+Q5Y2H44CC" },
  @{ File = "level-up.wav"; Text = DecodeUtf8 "5paw55qE6YWS5p2v5bey6Kej6ZSB77yM57un57ut5oyR5oiY5pu06auY5YiG5ZCn44CC" },
  @{ File = "game-over.wav"; Text = DecodeUtf8 "5pys5bGA57uT5p2f77yM5p2l55yL5LiA5LiL5L2g55qE57uT566X5oiQ57up5ZCn44CC" },
  @{ File = "record.wav"; Text = DecodeUtf8 "5oGt5Zac5L2g5Yi35paw5LqG6Ieq5bex55qE5pyA6auY57qq5b2V44CC" }
)

foreach ($prompt in $prompts) {
  $out = Join-Path $voiceDir $prompt.File
  $synth.SetOutputToWaveFile($out)
  $synth.Speak($prompt.Text)
  $synth.SetOutputToNull()
}

$synth.Dispose()
Get-ChildItem -Path $voiceDir | Select-Object Name,Length,LastWriteTime
