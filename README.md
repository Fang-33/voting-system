# Voting System

這是一個使用 Angular 前端和 Node.js Express 後端的投票系統，採用 Docker 容器化部署。

## 專案介紹

這個投票系統提供以下功能：

- **使用者管理**：註冊、登入和登出
- **投票活動管理**：創建、編輯和刪除投票活動
- **投票功能**：參與投票、修改或取消投票
- **結果查看**：即時顯示投票結果和數據統計
- **搜尋功能**：依據關鍵字搜尋投票活動
- **分享功能**：複製投票連結分享給其他使用者

系統支援多種投票活動狀態（進行中、已結束），並能清晰展示每個投票活動的詳細信息和參與人數。
使用者能夠便捷地管理自己創建的投票活動，也能輕鬆地參與其他使用者的投票。

## 專案結構

```
voting-system/
├── docker-compose.yml         # 整合前後端與資料庫的配置檔
├── update-and-run.js          # 自動更新與啟動腳本
├── .gitignore                 # Git 忽略檔案設定
├── voting-system-fe/          # 前端專案 (Angular) - 由腳本自動管理
│   ├── Dockerfile             # 前端 Docker 配置檔
│   ├── nginx.conf             # Nginx 路由配置檔
│   └── ...
└── voting-system-be/          # 後端專案 (Node.js + Express) - 由腳本自動管理
    ├── Dockerfile             # 後端 Docker 配置檔
    └── ...
```

## 前置需求

- Docker 與 Docker Compose
- Git

## 系統架構

- **前端**: Angular 17
- **後端**: Node.js + Express
- **資料庫**: PostgreSQL 13
- **ORM**: Prisma

## 快速開始

### 1. 克隆整合專案

```bash
git clone https://github.com/Fang-33/voting-system.git voting-system
cd voting-system
```

### 2. 使用自動化腳本

此專案提供自動化腳本，可自動處理前後端代碼的獲取、更新、配置與啟動：

```bash
node update-and-run.js
```

腳本會自動執行以下操作：

- 獲取/更新前後端代碼
- 確保所有必要配置文件存在
- 初始化資料庫（如果需要）
- 構建並啟動 Docker 容器

### 3. 手動配置（替代方法）

如果你想手動設置，可以按以下步驟操作：

#### A. 獲取前後端代碼

```bash
# 克隆前端代碼
git clone http://192.168.100.202/warriors/voting-system-fe.git voting-system-fe

# 克隆後端代碼
git clone http://192.168.100.202/warriors/voteting-system-be.git voting-system-be
```

#### B. 初始化資料庫

```bash
# 啟動資料庫容器
docker-compose up -d db

# 等待資料庫就緒
sleep 5

# 執行 Prisma 遷移
cd voting-system-be
npx prisma migrate dev --name init
cd ..
```

#### C. 啟動系統

```bash
# 構建並啟動所有服務
docker-compose up -d --build
```

### 4. 訪問應用

- 前端介面: http://localhost:4200
- 後端 API: http://localhost:3000
- API 文件: http://localhost:3000/api-docs

### 5. 清理資源（需要時執行）

```bash
# 停止並移除容器
docker-compose down

# 移除未使用的資源
docker system prune -f  # 移除 Cache
docker image prune      # 移除未使用 Image 檔案
```

## 開發指南

### 更新專案

當前後端代碼有更新時，只需再次執行自動化腳本：

```bash
node update-and-run.js
```

### 重設資料庫

如需完全重設資料庫：

```bash
# 停止所有容器
docker-compose down

# 刪除資料庫資料目錄
rm -rf data

# 重新執行自動化腳本
node update-and-run.js
```
