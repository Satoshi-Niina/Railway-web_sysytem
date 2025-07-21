-- PostgreSQLのスーパーユーザー（例: postgres）でログイン

-- 新しいユーザーを作成
CREATE USER niina WITH PASSWORD 'niina0077';

-- データベースを作成
CREATE DATABASE railway_system;

-- 作成したデータベースの所有者を新しいユーザーに設定
ALTER DATABASE railway_system OWNER TO niina;

-- 新しいデータベースへのすべての権限を付与
GRANT ALL PRIVILEGES ON DATABASE railway_system TO niina;
