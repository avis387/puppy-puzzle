# 重大事件與問題紀錄 (Major Events & Post-Mortems)

## 事件：GitHub Pages 部署 404 崩潰事件
**發生時間**：2026-05-13
**嚴重程度**：High (導致正式環境無法上線)
**影響範圍**：GitHub Pages 無法建置，導致玩家造訪 `https://avis387.github.io/puppy-puzzle/` 時遇到 404 File Not Found 錯誤。

### 發生原因 (Root Cause)
1. **殘留的空子模組 (Broken Submodules)**：
   本專案初期是由 `Claude-Code-Game-Studios` 模板複製而來。該模板內部包含了兩個 git 子模組 (submodules)：`.game-studios-temp` 與 `.ui-ux-pro-max-skill-temp`。
   在推送至新的 GitHub 儲存庫時，這些子模組的遠端 URL 沒有正確對應。當 GitHub Actions 執行 `actions/checkout@v4` 步驟來抓取程式碼時，遇到 `No url found for submodule path` 錯誤，導致整個建置 (Build) 流程中斷。
2. **路徑結構混淆**：
   原先遊戲主程式放置於 `puppy-puzzle/` 子資料夾內，加上 GitHub Pages 預設會將根目錄的 `README.md` 交由 Jekyll 編譯為首頁，導致路徑層級錯亂與渲染錯誤。

### 解決方案 (Resolution)
1. **移除損壞的子模組**：
   執行 `git rm --cached .game-studios-temp` 與 `git rm --cached .ui-ux-pro-max-skill-temp` 徹底清除損壞的參照，使 GitHub Actions 能夠順利拉取程式碼。
2. **專案結構扁平化**：
   將 `puppy-puzzle/` 內的 `index.html`, `game.js`, `style.css`, `levels.js` 直接移動至專案根目錄，免除路徑轉址的複雜度。
3. **禁用 Jekyll 編譯**：
   在根目錄加入 `.nojekyll` 空檔案，強制 GitHub Pages 以純靜態檔案的方式部署，避免與 `README.md` 發生衝突。

### 未來防範 (Action Items)
- 未來若使用任何專案模板建立新儲存庫，在第一次 commit 前，必須先執行 `git submodule status` 檢查並清除不必要的外部依賴。
- 部署純前端靜態專案時，預設在根目錄加入 `.nojekyll` 以策安全。
