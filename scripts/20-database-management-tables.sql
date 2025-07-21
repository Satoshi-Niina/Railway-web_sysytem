-- データベース管理用テーブル作成スクリプト

-- バックアップ履歴テーブル
CREATE TABLE IF NOT EXISTS database_backups (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'in_progress', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_by VARCHAR(100) DEFAULT 'system'
);

-- 復元履歴テーブル
CREATE TABLE IF NOT EXISTS database_restores (
    id SERIAL PRIMARY KEY,
    backup_filename VARCHAR(255) NOT NULL,
    restored_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'in_progress', 'failed')),
    error_message TEXT,
    restored_by VARCHAR(100) DEFAULT 'system'
);

-- データベース接続ログテーブル
CREATE TABLE IF NOT EXISTS database_connections (
    id SERIAL PRIMARY KEY,
    connection_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL CHECK (status IN ('connected', 'disconnected', 'error')),
    response_time_ms INTEGER,
    error_message TEXT,
    client_ip VARCHAR(45),
    user_agent TEXT
);

-- データベースパフォーマンスログテーブル
CREATE TABLE IF NOT EXISTS database_performance (
    id SERIAL PRIMARY KEY,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cpu_usage_percent DECIMAL(5,2),
    memory_usage_percent DECIMAL(5,2),
    disk_usage_percent DECIMAL(5,2),
    active_connections INTEGER,
    database_size_mb DECIMAL(10,2),
    slow_queries_count INTEGER DEFAULT 0,
    total_queries_count INTEGER DEFAULT 0
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_database_backups_created_at ON database_backups(created_at);
CREATE INDEX IF NOT EXISTS idx_database_backups_status ON database_backups(status);
CREATE INDEX IF NOT EXISTS idx_database_restores_restored_at ON database_restores(restored_at);
CREATE INDEX IF NOT EXISTS idx_database_connections_connection_time ON database_connections(connection_time);
CREATE INDEX IF NOT EXISTS idx_database_connections_status ON database_connections(status);
CREATE INDEX IF NOT EXISTS idx_database_performance_recorded_at ON database_performance(recorded_at);

-- 更新時刻自動更新のトリガー設定
CREATE TRIGGER update_database_backups_updated_at BEFORE UPDATE ON database_backups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_database_restores_updated_at BEFORE UPDATE ON database_restores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- サンプルデータ挿入（オプション）
INSERT INTO database_backups (filename, file_path, file_size, status, created_at, completed_at) VALUES
('backup_2024-01-15-12-00-00.sql', '/app/backups/backup_2024-01-15-12-00-00.sql', 1.2, 'completed', '2024-01-15 12:00:00', '2024-01-15 12:05:00'),
('backup_2024-01-14-12-00-00.sql', '/app/backups/backup_2024-01-14-12-00-00.sql', 1.1, 'completed', '2024-01-14 12:00:00', '2024-01-14 12:04:30'),
('backup_2024-01-13-12-00-00.sql', '/app/backups/backup_2024-01-13-12-00-00.sql', 1.3, 'completed', '2024-01-13 12:00:00', '2024-01-13 12:06:15');

INSERT INTO database_performance (cpu_usage_percent, memory_usage_percent, disk_usage_percent, active_connections, database_size_mb, slow_queries_count, total_queries_count) VALUES
(45.2, 62.8, 78.5, 12, 2400.5, 3, 1250),
(42.1, 61.3, 78.2, 11, 2398.2, 2, 1180),
(48.7, 64.2, 78.8, 15, 2402.1, 5, 1320); 