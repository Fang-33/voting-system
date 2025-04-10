#!/bin/bash
# 投票系統自動更新與啟動腳本

# 顯示彩色輸出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== 投票系統自動更新與啟動腳本 ===${NC}"

# 檢查並更新前端專案
echo -e "\n${GREEN}[1/6] 檢查並更新前端專案...${NC}"
if [ -d "voting-system-fe" ]; then
    echo "前端專案目錄已存在，更新中..."
    cd voting-system-fe
    git pull origin main
    if [ $? -ne 0 ]; then
        echo -e "${RED}前端專案更新失敗！${NC}"
        exit 1
    fi
    cd ..
else
    echo "前端專案目錄不存在，正在克隆..."
    git clone http://192.168.100.202/warriors/voting-system-fe.git voting-system-fe
    if [ $? -ne 0 ]; then
        echo -e "${RED}前端專案克隆失敗！${NC}"
        exit 1
    fi
fi

# 檢查並更新後端專案
echo -e "\n${GREEN}[2/6] 檢查並更新後端專案...${NC}"
if [ -d "voting-system-be" ]; then
    echo "後端專案目錄已存在，更新中..."
    cd voting-system-be
    git pull origin main
    if [ $? -ne 0 ]; then
        echo -e "${RED}後端專案更新失敗！${NC}"
        exit 1
    fi
    cd ..
else
    echo "後端專案目錄不存在，正在克隆..."
    git clone http://192.168.100.202/warriors/voteting-system-be.git voting-system-be
    if [ $? -ne 0 ]; then
        echo -e "${RED}後端專案克隆失敗！${NC}"
        exit 1
    fi
fi

# 檢查前端 Dockerfile 是否存在，若不存在則創建
echo -e "\n${GREEN}[3/6] 檢查前端 Dockerfile...${NC}"
if [ ! -f "voting-system-fe/Dockerfile" ]; then
    echo "前端 Dockerfile 不存在，正在創建..."
    cat >voting-system-fe/Dockerfile <<'EOF'
# 建置階段
FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# 運行階段
FROM nginx:alpine
# 複製自定義 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/voting-system/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

    echo "前端 Dockerfile 已創建"

    # 創建 nginx.conf 來處理 Angular 路由
    echo "創建 nginx.conf 以支援 Angular 路由..."
    cat >voting-system-fe/nginx.conf <<'EOF'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://server:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Host $host;
    }
}
EOF

    echo "nginx.conf 已創建"
fi

# 檢查後端 Dockerfile 是否存在，若不存在則創建
echo -e "\n${GREEN}[4/6] 檢查後端 Dockerfile...${NC}"
if [ ! -f "voting-system-be/Dockerfile" ]; then
    echo "後端 Dockerfile 不存在，正在創建..."
    cat >voting-system-be/Dockerfile <<'EOF'
# 使用 Node.js 官方鏡像
FROM node:18

# 設置工作目錄
WORKDIR /app

# 安裝構建工具
RUN apt-get update && apt-get install -y python3 make g++ openssl

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install --include=dev

# 複製項目文件
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 暴露端口
EXPOSE 3000

# 啟動應用
CMD ["npm", "run", "dev"]
EOF

    echo "後端 Dockerfile 已創建"
fi

# 檢查資料庫結構
echo -e "\n${GREEN}[5/6] 檢查資料庫結構...${NC}"
if [ ! -d "data" ] || [ -z "$(ls -A data 2>/dev/null)" ]; then
    echo "資料庫目錄不存在或為空，需要初始化資料庫..."

    # 先啟動資料庫容器
    echo "啟動資料庫容器..."
    docker-compose up -d db

    # 等待資料庫就緒
    echo "等待資料庫就緒..."
    sleep 10

    # 執行 Prisma 遷移
    echo "執行 Prisma 遷移..."
    cd voting-system-be
    npx prisma migrate dev --name init
    if [ $? -ne 0 ]; then
        echo -e "${RED}資料庫遷移失敗！${NC}"
        exit 1
    fi
    cd ..
else
    echo "資料庫目錄已存在，跳過初始化步驟"
fi

# 啟動整個系統
echo -e "\n${GREEN}[6/6] 重新構建並啟動系統...${NC}"
docker-compose down
docker-compose up -d --build

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}=== 系統啟動成功! ===${NC}"
    echo -e "前端訪問地址: ${BLUE}http://localhost:4200${NC}"
    echo -e "後端API地址: ${BLUE}http://localhost:3000${NC}"
else
    echo -e "\n${RED}系統啟動失敗，請檢查錯誤信息${NC}"
fi
