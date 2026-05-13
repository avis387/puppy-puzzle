# Game Screen UX Specification

## Overview
主遊戲畫面採用「溫馨繪本風 (Cozy Picture Book Style)」，以柔和的粉彩大地色系為主，邊緣圓潤，並具備紙質或蠟筆手繪的微細紋理，讓玩家感覺像是在閱讀一本溫暖的立體童書。

## Layout Structure
1. **Header (頂部控制列)**
   - **標題區**：使用充滿童趣但易讀的無襯線圓體 (e.g., Fredoka 或 Nunito)。標題旁邊有可愛的狗狗腳印裝飾。
   - **控制區**：包含「關卡選擇」下拉選單、「顯示解答」按鈕、「重新開始」按鈕。按鈕需具備像果凍或軟糖般的立體點擊感。
2. **Main Content (主要遊戲區)**
   - **左側 - 遊戲底盤 (Game Board)**：5x5 網格，底色為帶有手繪格線質感的草地綠色。
   - **右側 - 輔助面板 (Side Panels)**：
     - **玩法說明 (Instructions)**：像是一張貼在書頁上的便利貼，帶有輕微的旋轉角度和柔和的陰影。
     - **拼塊托盤 (Pieces Tray)**：像是一個用來收納玩具的淺木製托盤，內部有虛線或凹槽暗示這裡可以放拼塊。

## Color Palette (ui-ux-pro-max: Cozy Nature)
- **Background**: `#F9F6F0` (暖白色/羊皮紙色)
- **Board Base**: `#8EBA43` (柔和草地綠)
- **Board Grid Lines**: `#A5C962` (淺草綠)
- **Path Piece**: `#FFDF85` (溫暖的鵝黃色)
- **House Piece**: `#A37B5C` (木質棕色) + 屋頂 `#D96C5C` (磚紅色)
- **Primary Text**: `#5C4A3D` (深褐色，取代死板的純黑)
- **Accent/Action**: `#7FB069` (柔和的行動綠色)

## Typography
- **Primary Font**: `Fredoka` (用於標題與按鈕，圓潤親切)
- **Body Font**: `Nunito` (用於說明文字，易讀且柔和)

## Accessibility
- 色彩對比度需符合 AA 標準，特別是文字與背景的搭配。
- 拼塊上的「路徑」與「房子」必須有明顯的圖示區隔（如房子有屋頂形狀、路徑有腳印圖案），確保色弱玩家也能輕易辨識。
