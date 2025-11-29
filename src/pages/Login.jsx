import React, { useState, useEffect } from 'react';
// 1. 引入必要的 Firebase 服務和函式 (直接從 firebase 模組導入)
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    updateProfile, 
    onAuthStateChanged,
    // 移除 signInWithCustomToken 和 signInAnonymously 的導入
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// 導入 Auth 和 Firestore 實例
import { auth, db } from '../lib/firebase'; 

// --- [重要] 請將您下載圖片的公開網址替換到這裡 ---
const PET_ICON_URL = "https://placehold.co/40x40/B88C6E/FFF?text=%E7%88%AA%E5%8D%B0";
// ----------------------------------------------------


// =======================================================
// [修正] 輔助組件：單個輸入欄位 - 移到 Login 組件外部以防止重新渲染導致的焦點遺失
// =======================================================
const InputField = ({ id, type, value, onChange, placeholder, autoComplete, isRequired = true, loading }) => ( // <-- 加入 loading prop
    <div>
        <input
            id={id}
            name={id}
            type={type}
            autoComplete={autoComplete}
            required={isRequired}
            value={value}
            onChange={onChange}
            disabled={loading} // <-- 使用傳入的 loading prop
            className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-full shadow-sm placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400 transition duration-150 sm:text-base bg-white"
            placeholder={placeholder}
        />
    </div>
);


// 主要的登入頁面組件
const Login = () => {
    // 狀態來儲存表單輸入值
    const [loginId, setLoginId] = useState(''); 	
    const [password, setPassword] = useState(''); 	
    
    // 註冊專用的狀態
    const [realName, setRealName] = useState(''); 	
    const [nickname, setNickname] = useState(''); 	
    const [phoneNumber, setPhoneNumber] = useState(''); 
    const [address, setAddress] = useState(''); 	
    
    const [staySignedIn, setStaySignedIn] = useState(false); 
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [currentTab, setCurrentTab] = useState('signIn'); 
    
    // 修正: 使用狀態來管理 Firebase 認證準備就緒的狀態
    const [isAuthReady, setIsAuthReady] = useState(false);

    // 定義溫暖的主題顏色
    const ACCENT_COLOR = '#B88C6E'; 
    const LIGHT_ACCENT_COLOR = '#D4A48A';
    const CARD_BG = '#FFF7E6'; 
    const APP_BG = '#FDF8F0'; 
    const isSignIn = currentTab === 'signIn';
    const buttonText = isSignIn ? '登 入' : '註 冊';

    // 檢查 Firebase 服務是否可用，並確保 Auth 流程已經跑完
    const isFirebaseAvailable = !!auth && !!db && isAuthReady;
    
    // 使用 useEffect 管理 Firebase 認證 (確保異步操作完成後更新狀態)
    useEffect(() => { 
        
        if (!auth) {
             console.error("Firebase Auth 實例未成功導入！");
             setIsAuthReady(true); 
             return;
        }

        // --- [主要修正]：移除 signInUser 的邏輯以避免 (auth/admin-restricted-operation) 錯誤 ---
        // 由於我們只使用 Email/Password 登入，我們只需確保 auth 實例存在即可。
        // 我們直接將狀態設為 Ready
        setIsAuthReady(true); 

        // 設置 onAuthStateChanged 監聽器 
        const unsubscribe = onAuthStateChanged(auth, (user) => {
             console.log("Auth 狀態改變，當前用戶:", user ? user.uid : "None");
             // 可以在這裡處理登入/登出後的導航或用戶狀態更新
        });

        // 組件卸載時清除監聽器
        return () => unsubscribe(); 
    }, []); 


    // 處理表單提交
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isFirebaseAvailable) {
            setMessage({ type: 'error', text: 'Firebase 服務正在初始化中，請稍候。若持續未連線，請檢查控制台錯誤。' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            if (isSignIn) {
                // === 登入邏輯 (Sign In) ===
                await signInWithEmailAndPassword(auth, loginId, password);
                setMessage({ type: 'success', text: `登入成功！歡迎回來！當前用戶: ${auth.currentUser.displayName || auth.currentUser.email}` });
                
            } else {
                // === 註冊邏輯 (Sign Up) ===
                
                if (!loginId || !password || !phoneNumber || !address || !realName || !nickname) {
                    throw new Error("請填寫所有必填的註冊資訊。");
                }
                if (password.length < 6) {
                    throw new Error("密碼長度不得少於 6 個字元。");
                }

                // 1. (Auth) 在 Firebase Auth 建立帳號 (使用 email/password)
                const userCredential = await createUserWithEmailAndPassword(auth, loginId, password);
                const user = userCredential.user;
                const uid = user.uid; 

                // 2. (Auth) 將暱稱寫入 Auth 的 displayName 欄位
                await updateProfile(user, {
                    displayName: nickname
                });

                // 3. (Firestore) 將詳細資料寫入 Firestore
                const docPath = `artifacts/${typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'}/users/${uid}/userData/profile`;
                
                await setDoc(doc(db, docPath), {
                    email: loginId, 			
                    nickname: nickname, 		
                    realName: realName, 		
                    phoneNumber: phoneNumber,
                    address: address, 		
                    role: 'user', 			
                    createdAt: new Date().toISOString() 	
                });

                setMessage({ type: 'success', text: `註冊成功！歡迎 ${nickname} 加入 Pet's Home！` });
                
                // 註冊成功後清空欄位並切換回登入頁面
                setLoginId('');
                setPassword('');
                setRealName('');
                setNickname('');
                setPhoneNumber('');
                setAddress('');
                setCurrentTab('signIn');

            }
        } catch (error) {
            console.error("操作失敗:", error);
            
            let errorText = "發生未知錯誤，請稍後再試。";
            switch (error.code) {
                case 'auth/invalid-email':
                    errorText = 'Email 格式不正確。';
                    break;
                case 'auth/user-disabled':
                    errorText = '此帳號已被停用。';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorText = '帳號或密碼錯誤。'; 
                    break;
                case 'auth/email-already-in-use':
                    errorText = '此 Email 已經被註冊。';
                    break;
                case 'auth/weak-password':
                    errorText = '密碼強度太弱，請使用更複雜的密碼 (最少 6 個字元)。';
                    break;
                default:
                    errorText = error.message || errorText;
                    break;
            }

            setMessage({ type: 'error', text: errorText });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
          className="h-screen flex items-center px-4 py-6 justify-center font-inter transition-colors duration-500"
          style={{ backgroundColor: APP_BG }}
        >
          {/* 登入卡片 - 使用溫暖主題 */}
          <div 
            className="w-full max-w-sm sm:max-w-md rounded-2xl shadow-xl overflow-hidden" 
            style={{ backgroundColor: CARD_BG, boxShadow: `0 10px 30px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0.05)` }}
          >
            
            {/* 卡片頭部 / Logo */}
            <div className="p-8 pb-4 text-gray-800 text-center">
              <div className="flex justify-center items-center mb-4">
                <img
                  src="./public/images/petsIcon.png"
                  alt="寵物之家標誌"
                  className="w-8 h-8 object-contain" 
                />
                <span className="text-3xl font-bold ml-2 text-gray-800">PETS' HOME</span> 
              </div>
              <p className="text-sm text-gray-500 mb-6">您溫暖的寵物之家</p>

              {/* 登入 / 註冊 分頁切換 */}
              <div className="flex justify-center border-b border-gray-300 mb-8 text-sm font-semibold">
                {/* 登入 Tab */}
                <button
                  onClick={() => setCurrentTab('signIn')}
                  className={`px-4 py-2 uppercase tracking-wider transition duration-200 ${
                    isSignIn
                      ? 'text-gray-800 border-b-2 font-bold' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  style={isSignIn ? { borderColor: ACCENT_COLOR } : {}}
                  disabled={loading}
                >
                  登入 (SIGN IN)
                </button>
                {/* 註冊 Tab */}
                <button
                  onClick={() => setCurrentTab('signUp')}
                  className={`px-4 py-2 uppercase tracking-wider transition duration-200 ${
                    !isSignIn
                      ? 'text-gray-800 border-b-2 font-bold' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  style={!isSignIn ? { borderColor: ACCENT_COLOR } : {}}
                  disabled={loading}
                >
                  註冊 (SIGN UP)
                </button>
              </div>
            </div>

            {/* 表單主體 */}
            <form onSubmit={handleSubmit} className="px-8 pt-0 pb-8 space-y-6">
              
              {/* 訊息顯示區 */}
              {message.text && (
                <div 
                  className={`p-3 rounded-lg text-sm font-medium ${
                    message.type === 'error' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* === 登入欄位 START === */}
              {isSignIn && (
                <>
                  {/* 帳號 (Login ID - 使用 Email) 輸入欄位 */}
                  <InputField
                    id="loginId"
                    type="email" 
                    autoComplete="username"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="請輸入您的 Email 帳號"
                    loading={loading} // <-- 傳遞 loading
                  />
                  
                  {/* 密碼 輸入欄位 */}
                  <InputField
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="請輸入密碼"
                    loading={loading} // <-- 傳遞 loading
                  />

                  {/* 保持登入 Checkbox */}
                  <div className="flex items-center">
                    <input
                      id="staySignedIn"
                      name="staySignedIn"
                      type="checkbox"
                      checked={staySignedIn}
                      onChange={(e) => setStaySignedIn(e.target.checked)}
                      disabled={loading}
                      className="h-4 w-4 border-gray-400 rounded focus:ring-1 transition duration-150"
                      style={{ accentColor: ACCENT_COLOR }}
                    />
                    <label htmlFor="staySignedIn" className="ml-2 block text-sm text-gray-600">
                      保持登入狀態
                    </label>
                  </div>
                </>
              )}
              {/* === 登入欄位 END === */}


              {/* === 註冊欄位 START (按照指定順序) === */}
              {!isSignIn && (
                <>
                  {/* 1. 真實姓名 輸入欄位 */}
                  <InputField
                    id="realName"
                    type="text"
                    autoComplete="name"
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    placeholder="請輸入真實姓名"
                    loading={loading} // <-- 傳遞 loading
                  />

                  {/* 2. 暱稱 輸入欄位 */}
                  <InputField
                    id="nickname"
                    type="text" 
                    autoComplete="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="請輸入暱稱"
                    loading={loading} // <-- 傳遞 loading
                  />

                  {/* 3. 連絡電話 輸入欄位 */}
                  <InputField
                    id="phoneNumber"
                    type="tel" 
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="請輸入連絡電話"
                    loading={loading} // <-- 傳遞 loading
                  />
                  
                  {/* 4. 住址 輸入欄位 */}
                  <InputField
                    id="address"
                    type="text"
                    autoComplete="street-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="請輸入住址"
                    loading={loading} // <-- 傳遞 loading
                  />
                  
                  {/* 5. 設定帳號 輸入欄位 (Login ID - Email) */}
                  <InputField
                    id="loginId_signup"
                    type="email" 
                    autoComplete="new-username"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="設定帳號 (請使用 Email)"
                    loading={loading} // <-- 傳遞 loading
                  />

                  {/* 6. 設定密碼 輸入欄位 */}
                  <InputField
                    id="password_signup"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="設定密碼 (最少 6 個字元)"
                    loading={loading} // <-- 傳遞 loading
                  />
                </>
              )}
              {/* === 註冊欄位 END === */}


              {/* 登入 / 註冊 按鈕 */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !isFirebaseAvailable}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-lg text-lg font-bold text-white transition duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50 ${
                    loading || !isFirebaseAvailable
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'hover:bg-opacity-90 transform hover:scale-[1.01] active:scale-[0.98]'
                  }`}
                  style={{ 
                      backgroundColor: ACCENT_COLOR, 
                      boxShadow: '0 4px 10px rgba(184, 140, 110, 0.4)' 
                  }}
                >
                  {loading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    buttonText
                  )}
                </button>
                {!isAuthReady && (
                    <p className="text-center text-xs mt-2 text-yellow-600">
                        正在初始化 Firebase 服務及進行認證...
                    </p>
                )}
                {isAuthReady && !isFirebaseAvailable && (
                    <p className="text-center text-xs mt-2 text-red-500">
                        服務未連線 (Firebase 初始化或配置失敗，請檢查控制台錯誤)。
                    </p>
                )}
              </div>
            </form>
            
            {isSignIn && (
              <div className="px-8 pb-8 text-center">
                <a href="#" className="text-sm font-medium text-gray-500 hover:text-gray-800 transition duration-200" style={{ color: LIGHT_ACCENT_COLOR }}>
                  忘記密碼？
                </a>
              </div>
            )}

          </div>
        </div>
    );
};

export default Login;