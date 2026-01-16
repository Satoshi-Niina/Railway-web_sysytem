import express from 'express';
import bcrypt from 'bcrypt';
import db from '../db.js';

const router = express.Router();

/**
 * ログインエンドポイント
 * master_data.usersテーブルと照合して認証
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('ログイン試行:', username);

    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'ユーザー名とパスワードを入力してください' 
      });
    }

    // master_data.usersテーブルからユーザー情報を取得
    const result = await db.query(
      `SELECT 
        id, 
        username, 
        email, 
        password_hash, 
        role, 
        is_active,
        management_office_id,
        created_at,
        updated_at
       FROM master_data.users 
       WHERE username = $1 AND is_active = true`,
      [username]
    );

    if (result.rows.length === 0) {
      console.warn('ユーザーが見つかりません:', username);
      return res.status(401).json({ 
        success: false,
        error: 'ユーザー名またはパスワードが正しくありません' 
      });
    }

    const user = result.rows[0];

    // パスワード検証
    let passwordMatch = false;
    
    // bcryptハッシュの場合
    if (user.password_hash && user.password_hash.startsWith('$2')) {
      passwordMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      // 平文パスワードの場合（開発環境のみ）
      passwordMatch = password === user.password_hash;
    }

    if (!passwordMatch) {
      console.warn('パスワードが一致しません:', username);
      return res.status(401).json({ 
        success: false,
        error: 'ユーザー名またはパスワードが正しくありません' 
      });
    }

    // 管理者・運用者のみアクセス許可
    const allowedRoles = ['admin', 'operator', 'system_admin', 'operation_manager'];
    if (!allowedRoles.includes(user.role.toLowerCase())) {
      console.warn('アクセス権限がありません:', user.role);
      return res.status(403).json({ 
        success: false,
        error: 'このシステムへのアクセス権限がありません',
        message: 'システム管理者または運用管理者のみ利用可能です',
        userRole: user.role
      });
    }

    // パスワードハッシュを除いてレスポンス
    const { password_hash, ...userWithoutPassword } = user;

    console.log('✅ ログイン成功:', username, user.role);

    res.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('ログインエラー:', error);
    res.status(500).json({ 
      success: false,
      error: 'サーバーエラーが発生しました',
      details: error.message 
    });
  }
});

/**
 * ユーザー情報取得エンドポイント（デバッグ用）
 */
router.get('/users', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, username, email, role, is_active, created_at 
       FROM master_data.users 
       WHERE is_active = true
       ORDER BY id`
    );
    
    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    res.status(500).json({ 
      success: false,
      error: 'サーバーエラーが発生しました' 
    });
  }
});

export default router;
