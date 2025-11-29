// 這是 Firebase 初始化檔案 (Firebase v9/v10 模組化導入)
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ----------------------------------------------------
// 最終配置：由於環境變數載入問題，我們直接使用硬編碼的配置值。
// 這些值是從您提供的環境變數中複製過來的。
// ----------------------------------------------------
const firebaseConfig = {
  // 您的 API Key (已確認的值)
  apiKey: "AIzaSyALGApEjuADOOWzE9uIqXzGolrg8FNMAiY",
  
  // 您的其他配置
  authDomain: "animal-website-account.firebaseapp.com",
  projectId: "animal-website-account",
  storageBucket: "animal-website-account.firebasestorage.app",
  messagingSenderId: "801839513580",
  appId: "1:801839513580:web:539ff54a7604def9fc0aaf", // 注意：這裡已經修正為您的 App ID
};

// ----------------------------------------------------
// 關鍵診斷步驟 (現在會輸出正確的配置)
// ----------------------------------------------------
console.log("🚀 Firebase Configuration being used:", firebaseConfig);


// 檢查關鍵配置是否遺失
if (!firebaseConfig.apiKey) {
    console.error("❌ Firebase 初始化失敗: API Key 遺失.");
    throw new Error("Firebase configuration variables missing.");
}

// 1. 初始化 Firebase App
let app;
try {
    app = initializeApp(firebaseConfig);
    console.log("✅ Firebase App initialized successfully.");
} catch (e) {
    // 如果初始化失敗，通常是 API Key 真的錯了，但我們已確認值是正確的
    console.error("🔥 Firebase initializeApp 呼叫本身發生錯誤:", e);
    throw e;
}


// 2. 獲取服務實例
export const auth = getAuth(app);
export const db = getFirestore(app);

// 導出基礎 app 實例
export default app;