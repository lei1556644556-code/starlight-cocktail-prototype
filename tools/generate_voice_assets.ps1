$ErrorActionPreference = "Stop"

$voiceDir = Join-Path (Get-Location) "assets\audio\voice"
New-Item -ItemType Directory -Force -Path $voiceDir | Out-Null

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
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

function BuildSsml($text, $rate, $pitch) {
  $escaped = [System.Security.SecurityElement]::Escape($text)
  $comma = [string][char]0xFF0C
  $period = [string][char]0x3002
  $bang = [string][char]0xFF01
  $escaped = $escaped.Replace($comma, "$comma<break time=""230ms""/>")
  $escaped = $escaped.Replace($period, "$period<break time=""320ms""/>")
  $escaped = $escaped.Replace($bang, "$bang<break time=""260ms""/>")
  return "<speak version=""1.0"" xml:lang=""zh-CN""><prosody rate=""$rate"" pitch=""$pitch"" volume=""+0%"">$escaped</prosody></speak>"
}

$prompts = @(
  @{ File = "start.wav"; Text = DecodeUtf8 "5qyi6L+O5p2l5Yiw5pif5YWJ54m56LCD44CC5LuK5pma77yM5Lqk57uZ5oiR5ZCn44CC5oqK5omY55uY6L276L275pS+5LiK5qGM6Z2i77yM5oiR5Lus5byA5aeL6LCD5Yi244CC"; Rate = "-4%"; Pitch = "+5%" },
  @{ File = "restore.wav"; Text = DecodeUtf8 "5oiR5bey57uP5biu5L2g5o6l5Zue5LiK5qyh55qE6L+b5bqm5LqG44CC5Yir5oCl77yM6IqC5aWP6L+Y5Zyo44CC"; Rate = "-5%"; Pitch = "+4%" },
  @{ File = "use-tool.wav"; Text = DecodeUtf8 "5qGM6Z2i5bey57uP5pyJ5Lqb5oul5oyk5LqG44CC5Y+v5Lul55So5Z6D5Zy+5qG277yM5oiW6ICF5aS55a2Q77yM5biu5L2g5oqK5bGA6Z2i5pW055CG5Zue5p2l44CC"; Rate = "-6%"; Pitch = "+3%" },
  @{ File = "invalid.wav"; Text = DecodeUtf8 "6L+Z6YeM6L+Y5LiN6IO96L+Z5qC35pS+44CC5o2i5LiA5Liq5L2N572u77yM5Lya5pu06aG65omL44CC"; Rate = "-3%"; Pitch = "+5%" },
  @{ File = "full-tray.wav"; Text = DecodeUtf8 "5b6I5aW977yM6L+Z5LiA55uY5a6M5oiQ5LqG44CC6aaZ5rCU5b6I5ryC5Lqu77yM57un57ut5L+d5oyB44CC"; Rate = "-2%"; Pitch = "+6%" },
  @{ File = "level-up.wav"; Text = DecodeUtf8 "5paw55qE6YWS5p2v5bey57uP6Kej6ZSB44CC546w5Zyo77yM5Y+v5Lul6LCD5Ye65pu06L+35Lq655qE5bGC5qyh5LqG44CC"; Rate = "-3%"; Pitch = "+6%" },
  @{ File = "game-over.wav"; Text = DecodeUtf8 "6L+Z5LiA5bGA5YWI5Yiw6L+Z6YeM44CC5p2l55yL55yL5L2g55qE5oiQ57up77yM5YaN5Yaz5a6a5LiL5LiA5p2v5oCO5LmI6LCD44CC"; Rate = "-7%"; Pitch = "+2%" },
  @{ File = "record.wav"; Text = DecodeUtf8 "5ryC5Lqu44CC5L2g5Yi35paw5LqG6Ieq5bex55qE57qq5b2V44CC5LuK5pma55qE54q25oCB77yM5b6I5LiN6ZSZ44CC"; Rate = "-2%"; Pitch = "+6%" }
)

foreach ($prompt in $prompts) {
  $out = Join-Path $voiceDir $prompt.File
  $synth.SetOutputToWaveFile($out)
  $synth.SpeakSsml((BuildSsml $prompt.Text $prompt.Rate $prompt.Pitch))
  $synth.SetOutputToNull()
}

$synth.Dispose()
Get-ChildItem -Path $voiceDir | Select-Object Name,Length,LastWriteTime
