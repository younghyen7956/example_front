# --- 1단계: 빌드(Build) 스테이지 ---
# Node.js 이미지를 사용하여 Vue 앱을 빌드합니다.
FROM node:18 AS builder

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json을 먼저 복사하여 의존성 캐싱을 활용
COPY package*.json ./

# 의존성 설치
RUN npm install

# 나머지 소스 코드를 복사
COPY . .

# Vue 앱 빌드. 'dist' 폴더가 생성됩니다.
RUN npm run build


# --- 2단계: 서비스(Serve) 스테이지 ---
# 가벼운 Nginx 이미지를 사용하여 빌드된 파일을 서비스합니다.
FROM nginx:1.25

# 빌드 스테이지에서 생성된 'dist' 폴더의 내용물만 Nginx의 기본 웹 루트 폴더로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 위에서 작성한 커스텀 Nginx 설정을 Nginx의 설정 폴더에 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 컨테이너가 80번 포트를 외부에 노출하도록 설정
EXPOSE 8080

# Nginx 서버 실행
CMD ["nginx", "-g", "daemon off;"]