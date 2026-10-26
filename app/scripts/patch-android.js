// Ajustes no projeto Android gerado pelo Capacitor: paisagem, tela cheia, versão e assinatura
const fs = require("fs"), path = require("path");
const A = path.join(__dirname, "..", "android", "app");
const rw = (f, fn) => { const p = path.join(A, f); const s = fs.readFileSync(p, "utf8"); const n = fn(s); if (n === s) throw new Error("patch sem efeito: " + f); fs.writeFileSync(p, n); console.log("ok:", f); };

// 1) só horizontal
rw("src/main/AndroidManifest.xml", s => s.replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="sensorLandscape"'));

// 2) tela cheia imersiva (esconde barra de status e de navegação)
const javaDir = path.join(A, "src/main/java/br/com/hillracergt/game");
fs.writeFileSync(path.join(javaDir, "MainActivity.java"), `package br.com.hillracergt.game;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        hideBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideBars();
    }

    private void hideBars() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.hide(WindowInsetsCompat.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
`);
console.log("ok: MainActivity.java");

// 3) versão (vem do GitHub Actions) + assinatura de release (vem dos secrets)
rw("build.gradle", s => s
  .replace(/versionCode \d+/, 'versionCode Integer.parseInt(System.getenv("VERSION_CODE") ?: "1")')
  .replace(/versionName "[^"]*"/, 'versionName System.getenv("VERSION_NAME") ?: "1.0"')
  .replace("    buildTypes {", `    signingConfigs {
        release {
            if (System.getenv("KEYSTORE_FILE")) {
                storeFile file(System.getenv("KEYSTORE_FILE"))
                storePassword System.getenv("KEYSTORE_PASSWORD")
                keyAlias System.getenv("KEY_ALIAS")
                keyPassword System.getenv("KEY_PASSWORD")
            }
        }
    }
    buildTypes {`)
  .replace("            minifyEnabled false", `            minifyEnabled false
            if (System.getenv("KEYSTORE_FILE")) signingConfig signingConfigs.release`));

// 4) cor de fundo escura (sem flash branco)
rw("src/main/res/values/styles.xml", s => s.replace('parent="Theme.AppCompat.Light.DarkActionBar">', 'parent="Theme.AppCompat.NoActionBar">\n        <item name="android:windowBackground">#0d1117</item>'));
