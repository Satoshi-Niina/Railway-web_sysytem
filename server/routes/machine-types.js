import express from 'express';
import db from '../db.js';

const router = express.Router();

// 機種マスタ一覧取得
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id,
        type_code,
        type_name,
        model_name,
        manufacturer,
        category,
        description,
        created_at,
        updated_at
      FROM master_data.machine_types
      ORDER BY type_code
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('機種マスタ取得エラー:', error);
    res.status(500).json({ 
      error: '機種マスタの取得に失敗しました',
      details: error.message 
    });
  }
});

// 機種マスタ詳細取得
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT 
        id,
        type_code,
        type_name,
        model_name,
        manufacturer,
        category,
        description,
        created_at,
        updated_at
      FROM master_data.machine_types
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '機種マスタが見つかりません' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('機種マスタ詳細取得エラー:', error);
    res.status(500).json({ 
      error: '機種マスタの取得に失敗しました',
      details: error.message 
    });
  }
});

// 機種マスタ新規登録
router.post('/', async (req, res) => {
  try {
    const { type_name, model_name, manufacturer, category, description } = req.body;
    
    // 必須項目チェック
    if (!type_name || !model_name) {
      return res.status(400).json({ 
        error: '機種名とメーカー型式は必須です' 
      });
    }
    
    // IDを生成（MT-ランダム8桁）
    const id = 'MT-' + Math.random().toString().slice(2, 10);
    const type_code = id;
    
    const result = await db.query(`
      INSERT INTO master_data.machine_types 
        (id, type_code, type_name, model_name, manufacturer, category, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [id, type_code, type_name, model_name, manufacturer, category, description]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('機種マスタ登録エラー:', error);
    res.status(500).json({ 
      error: '機種マスタの登録に失敗しました',
      details: error.message 
    });
  }
});

// 機種マスタ更新
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type_name, model_name, manufacturer, category, description } = req.body;
    
    // 必須項目チェック
    if (!type_name || !model_name) {
      return res.status(400).json({ 
        error: '機種名とメーカー型式は必須です' 
      });
    }
    
    const result = await db.query(`
      UPDATE master_data.machine_types
      SET 
        type_name = $2,
        model_name = $3,
        manufacturer = $4,
        category = $5,
        description = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, type_name, model_name, manufacturer, category, description]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '機種マスタが見つかりません' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('機種マスタ更新エラー:', error);
    res.status(500).json({ 
      error: '機種マスタの更新に失敗しました',
      details: error.message 
    });
  }
});

// 機種マスタ削除
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 使用中かチェック
    const usageCheck = await db.query(`
      SELECT COUNT(*) as count 
      FROM master_data.machines 
      WHERE machine_type_id = $1
    `, [id]);
    
    if (usageCheck.rows[0].count > 0) {
      return res.status(400).json({ 
        error: 'この機種は機械マスタで使用されているため削除できません' 
      });
    }
    
    const result = await db.query(`
      DELETE FROM master_data.machine_types
      WHERE id = $1
      RETURNING id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '機種マスタが見つかりません' });
    }
    
    res.json({ message: '機種マスタを削除しました', id: result.rows[0].id });
  } catch (error) {
    console.error('機種マスタ削除エラー:', error);
    res.status(500).json({ 
      error: '機種マスタの削除に失敗しました',
      details: error.message 
    });
  }
});

export default router;
