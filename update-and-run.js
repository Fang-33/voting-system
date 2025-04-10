const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// 配置
const config = {
  frontendRepo: "http://192.168.100.202/warriors/voting-system-fe.git",
  backendRepo: "http://192.168.100.202/warriors/voteting-system-be.git",
};

// 日誌輸出函數
function log(message, type = "info") {
  const colors = {
    info: "\x1b[34m", // 藍色
    success: "\x1b[32m", // 綠色
    error: "\x1b[31m", // 紅色
    reset: "\x1b[0m", // 重置
  };

  console.log(`${colors[type]}${message}${colors.reset}`);
}

// 執行命令並返回輸出
function runCommand(command, options = {}) {
  try {
    log(`執行命令: ${command}`, "info");
    return execSync(command, {
      stdio: "inherit",
      ...options,
    });
  } catch (error) {
    log(`命令執行失敗: ${error.message}`, "error");
    throw error;
  }
}

// 檢查目錄是否存在
function directoryExists(directory) {
  return fs.existsSync(directory) && fs.statSync(directory).isDirectory();
}

// 檢查文件是否存在
function fileExists(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile();
}

// 創建前端 Dockerfile
function createFrontendDockerfile() {
  const dockerfilePath = path.join("voting-system-fe", "Dockerfile");
  const nginxConfPath = path.join("voting-system-fe", "nginx.conf");

  if (!fileExists(dockerfilePath)) {
    log("創建前端 Dockerfile...", "info");

    const dockerfileContent = `# 建置階段
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
CMD ["nginx", "-g", "daemon off;"]`;

    fs.writeFileSync(dockerfilePath, dockerfileContent);
    log("前端 Dockerfile 已創建", "success");
  }

  if (!fileExists(nginxConfPath)) {
    log("創建 nginx.conf...", "info");

    const nginxConfContent = `server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {      try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://server:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Host $host;
    }
}`;

    fs.writeFileSync(nginxConfPath, nginxConfContent);
    log("nginx.conf 已創建", "success");
  }
}

// 創建後端 Dockerfile
function createBackendDockerfile() {
  const dockerfilePath = path.join("voting-system-be", "Dockerfile");

  if (!fileExists(dockerfilePath)) {
    log("創建後端 Dockerfile...", "info");

    const dockerfileContent = `# 使用 Node.js 官方鏡像
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
CMD ["npm", "run", "dev"]`;

    fs.writeFileSync(dockerfilePath, dockerfileContent);
    log("後端 Dockerfile 已創建", "success");
  }
}

// 創建啟動腳本 (用於在容器內執行 Prisma 遷移)
function createStartScript() {
  const startScriptPath = path.join("voting-system-be", "start.sh");

  if (!fileExists(startScriptPath)) {
    log("創建後端啟動腳本...", "info");

    const startScriptContent = `#!/bin/sh
# 等待資料庫就緒
echo "Waiting for database to be ready..."
sleep 5

# 執行遷移
echo "Running migrations..."
npx prisma migrate deploy

# 啟動應用
echo "Starting application..."
npm run dev`;

    fs.writeFileSync(startScriptPath, startScriptContent);
    // 設定執行權限
    fs.chmodSync(startScriptPath, "755");
    log("後端啟動腳本已創建", "success");
  }
}

// 更新後端 Dockerfile 以使用啟動腳本
function updateBackendDockerfile() {
  const dockerfilePath = path.join("voting-system-be", "Dockerfile");

  if (fileExists(dockerfilePath)) {
    const dockerfileContent = fs.readFileSync(dockerfilePath, "utf8");

    // 檢查是否已經使用啟動腳本
    if (!dockerfileContent.includes("./start.sh")) {
      const updatedContent = dockerfileContent.replace(
        'CMD ["npm", "run", "dev"]',
        'COPY start.sh ./\nRUN chmod +x ./start.sh\nCMD ["./start.sh"]'
      );

      fs.writeFileSync(dockerfilePath, updatedContent);
      log("後端 Dockerfile 已更新為使用啟動腳本", "success");
    }
  }
}

// 主程序
async function main() {
  try {
    log("=== 投票系統自動更新與啟動腳本 ===", "info");

    // 1. 檢查並更新前端專案
    log("\n[1/7] 檢查並更新前端專案...", "info");
    if (directoryExists("voting-system-fe")) {
      log("前端專案目錄已存在，更新中...", "info");
      runCommand("cd voting-system-fe && git pull origin main");
    } else {
      log("前端專案目錄不存在，正在克隆...", "info");
      runCommand(`git clone ${config.frontendRepo} voting-system-fe`);
    }

    // 2. 檢查並更新後端專案
    log("\n[2/7] 檢查並更新後端專案...", "info");
    if (directoryExists("voting-system-be")) {
      log("後端專案目錄已存在，更新中...", "info");
      runCommand("cd voting-system-be && git pull origin main");
    } else {
      log("後端專案目錄不存在，正在克隆...", "info");
      runCommand(`git clone ${config.backendRepo} voting-system-be`);
    }

    // 3. 檢查前端 Dockerfile
    log("\n[3/7] 檢查前端 Dockerfile...", "info");
    createFrontendDockerfile();

    // 4. 檢查後端 Dockerfile
    log("\n[4/7] 檢查後端 Dockerfile...", "info");
    createBackendDockerfile();

    // 5. 創建啟動腳本
    log("\n[5/7] 創建啟動腳本...", "info");
    createStartScript();

    // 6. 更新後端 Dockerfile 以使用啟動腳本
    log("\n[6/7] 更新後端 Dockerfile...", "info");
    updateBackendDockerfile();

    // 7. 啟動整個系統
    log("\n[7/7] 構建並啟動系統...", "info");
    runCommand("docker-compose down");
    runCommand("docker-compose up -d --build");

    log("\n=== 系統啟動成功! ===", "success");
    log("前端訪問地址: http://localhost:4200", "info");
    log("後端API地址: http://localhost:3000", "info");
    log("\n提示：初次啟動後端容器會自動執行資料庫遷移", "info");
  } catch (error) {
    log(`腳本執行失敗: ${error.message}`, "error");
    process.exit(1);
  }
}

// 執行主程序
main();
