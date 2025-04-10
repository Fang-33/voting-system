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
├── voting-system-fe/          # 前端專案 (Angular)
│   ├── Dockerfile             # 前端 Docker 配置檔
│   ├── nginx.conf             # Nginx 路由配置檔
│   └── ...
└── voting-system-be/          # 後端專案 (Node.js + Express)
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

### 1. 克隆專案

```bash
git clone https://github.com/Fang-33/voting-system.git voting-system
cd voting-system
```

### 2. 配置資料庫

在啟動服務之前，需要先執行資料庫遷移：

```bash
# 進入後端目錄
cd voting-system-be

# 執行 Prisma 遷移
npx prisma migrate dev --name init

# 返回根目錄
cd ..
```

### 3. 啟動系統

```bash
# 構建並啟動所有服務
docker-compose up --build
```

或使用後台模式：

```bash
docker-compose up -d --build
```

移除暫存檔

```bash
    docker system prune -f //移除Cache
    docker image prune //移除未使用Image檔案
```

### 4. 訪問應用

- 前端介面: http://localhost:4200
- 後端 API: http://localhost:3000
- API 文件: http://localhost:3000/api-docs
