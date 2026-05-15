# 星光特调 Android WebView APK

这是一个把当前 H5 游戏打包进 Android WebView 的壳工程。

## 构建要求

- JDK 17
- Android Studio，或 Android SDK + Gradle
- 首次构建需要联网下载 Android Gradle Plugin

## 构建 Debug APK

在 `android-webview-apk` 目录执行：

```powershell
gradle assembleDebug
```

或用 Android Studio 打开 `android-webview-apk`，等待 Gradle 同步完成后，点击 Build APK。

生成文件位置：

```text
app/build/outputs/apk/debug/app-debug.apk
```

## 更新 H5 内容

每次改完根目录的 H5 后，把这些文件同步到：

```text
app/src/main/assets/www/
```

包括：

- `index.html`
- `styles.css`
- `game.js`
- `assets/`
