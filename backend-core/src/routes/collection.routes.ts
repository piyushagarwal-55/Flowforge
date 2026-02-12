import { Router, Request, Response, NextFunction } from 'express';
import CollectionDefinitionsModel from '../models/CollectionDefinitions.model';
import { getModel } from '../db/getModel';
import { resolveObject } from '../utils/resolveValue';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /collections
 * List all collection schemas
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('[getCollections] 📥 Fetching collection schemas');

    const collections = await CollectionDefinitionsModel.find({}).lean();

    const schemas = collections.reduce<Record<string, string[]>>((acc, col) => {
      acc[col.collectionName] = Object.keys(col.fields || {});
      return acc;
    }, {});

    logger.info('[getCollections] ✅ Collection schemas fetched', {
      collections: Object.keys(schemas),
    });

    res.status(200).json({
      ok: true,
      schemas,
    });
  } catch (error) {
    logger.error('[getCollections] ❌ Error fetching collections', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

/**
 * POST /collections
 * Create new collection definition
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { collectionName, fields } = req.body;

    if (!collectionName || !fields) {
      res.status(400).json({
        error: 'collectionName and fields are required',
      });
      return;
    }

    logger.info('[createCollection] 📥 Creating collection', {
      collectionName,
      fieldCount: Object.keys(fields).length,
    });

    const collection = await CollectionDefinitionsModel.findOneAndUpdate(
      { collectionName },
      { collectionName, fields },
      { upsert: true, new: true }
    );

    logger.info('[createCollection] ✅ Collection created', {
      collectionName,
    });

    res.status(201).json({
      ok: true,
      collection: {
        collectionName: collection.collectionName,
        fields: collection.fields,
      },
    });
  } catch (error) {
    logger.error('[createCollection] ❌ Error creating collection', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

/**
 * GET /collections/:id
 * Get collection definition by name
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: collectionName } = req.params;

    logger.info('[getCollection] 📥 Fetching collection', {
      collectionName,
    });

    const collection = await CollectionDefinitionsModel.findOne({ collectionName });

    if (!collection) {
      res.status(404).json({
        error: 'Collection not found',
      });
      return;
    }

    logger.info('[getCollection] ✅ Collection found', {
      collectionName,
      fieldCount: Object.keys(collection.fields || {}).length,
    });

    res.status(200).json({
      ok: true,
      collection: {
        collectionName: collection.collectionName,
        fields: collection.fields,
      },
    });
  } catch (error) {
    logger.error('[getCollection] ❌ Error fetching collection', {
      collectionName: req.params.id,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

/**
 * PUT /collections/:id
 * Update collection definition
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: collectionName } = req.params;
    const { fields } = req.body;

    if (!fields) {
      res.status(400).json({
        error: 'fields are required',
      });
      return;
    }

    logger.info('[updateCollection] 📥 Updating collection', {
      collectionName,
      fieldCount: Object.keys(fields).length,
    });

    const collection = await CollectionDefinitionsModel.findOneAndUpdate(
      { collectionName },
      { fields },
      { new: true }
    );

    if (!collection) {
      res.status(404).json({
        error: 'Collection not found',
      });
      return;
    }

    logger.info('[updateCollection] ✅ Collection updated', {
      collectionName,
    });

    res.status(200).json({
      ok: true,
      collection: {
        collectionName: collection.collectionName,
        fields: collection.fields,
      },
    });
  } catch (error) {
    logger.error('[updateCollection] ❌ Error updating collection', {
      collectionName: req.params.id,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

/**
 * DELETE /collections/:id
 * Delete collection definition
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: collectionName } = req.params;

    logger.info('[deleteCollection] 📥 Deleting collection', {
      collectionName,
    });

    const collection = await CollectionDefinitionsModel.findOneAndDelete({ collectionName });

    if (!collection) {
      res.status(404).json({
        error: 'Collection not found',
      });
      return;
    }

    logger.info('[deleteCollection] ✅ Collection deleted', {
      collectionName,
    });

    res.status(200).json({
      ok: true,
      message: 'Collection deleted successfully',
    });
  } catch (error) {
    logger.error('[deleteCollection] ❌ Error deleting collection', {
      collectionName: req.params.id,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

/**
 * GET /collections/:id/data
 * Get data from collection
 */
router.get('/:id/data', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: collectionName } = req.params;
    const { filters = '{}', findType = 'many' } = req.query;

    logger.info('[getCollectionData] 📥 Querying collection', {
      collectionName,
      filters,
      findType,
    });

    // Parse filters
    let parsedFilters: any = {};
    try {
      parsedFilters = JSON.parse(filters as string);
    } catch (error) {
      res.status(400).json({
        error: 'Invalid filters JSON',
      });
      return;
    }

    // Get model
    const Model = getModel(collectionName);
    if (!Model) {
      res.status(404).json({
        error: `Model not found: ${collectionName}`,
      });
      return;
    }

    // Query data
    const result =
      findType === 'many'
        ? await Model.find(parsedFilters)
        : await Model.findOne(parsedFilters);

    const resultCount = Array.isArray(result) ? result.length : result ? 1 : 0;

    logger.info('[getCollectionData] ✅ Query completed', {
      collectionName,
      resultCount,
      findType,
    });

    res.status(200).json({
      ok: true,
      data: result,
      count: resultCount,
    });
  } catch (error) {
    logger.error('[getCollectionData] ❌ Error querying collection', {
      collectionName: req.params.id,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

/**
 * POST /collections/:id/data
 * Insert data into collection
 */
router.post('/:id/data', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: collectionName } = req.params;
    const { data } = req.body;

    if (!data || typeof data !== 'object') {
      res.status(400).json({
        error: 'data object is required',
      });
      return;
    }

    logger.info('[insertCollectionData] 📥 Inserting into collection', {
      collectionName,
      fieldCount: Object.keys(data).length,
    });

    // Get model
    const Model = getModel(collectionName);
    if (!Model) {
      res.status(404).json({
        error: `Model not found: ${collectionName}`,
      });
      return;
    }

    // Validate data is not empty
    if (Object.keys(data).length === 0) {
      res.status(400).json({
        error: 'data object cannot be empty',
      });
      return;
    }

    // Insert data
    const created = await Model.create(data);

    logger.info('[insertCollectionData] ✅ Data inserted', {
      collectionName,
      insertedId: created._id,
    });

    res.status(201).json({
      ok: true,
      data: created,
      insertedId: created._id,
    });
  } catch (error) {
    logger.error('[insertCollectionData] ❌ Error inserting data', {
      collectionName: req.params.id,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    next(error);
  }
});

export default router;
