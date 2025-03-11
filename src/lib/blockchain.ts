
import CryptoJS from 'crypto-js';
import { supabase } from '@/integrations/supabase/client';

interface BlockData {
  transactions: Array<{
    id: string;
    sender_id?: string | null;
    receiver_id?: string | null;
    amount: number;
    description?: string | null;
    transaction_type: string;
    timestamp: string;
  }>;
  timestamp: string;
}

interface Block {
  id?: string;
  blockNumber: number;
  timestamp: string;
  data: BlockData;
  previousHash: string | null;
  hash: string;
}

// Calculate hash for a block
const calculateHash = (
  blockNumber: number, 
  previousHash: string | null, 
  timestamp: string, 
  data: BlockData
): string => {
  return CryptoJS.SHA256(
    blockNumber + 
    (previousHash || '') + 
    timestamp + 
    JSON.stringify(data)
  ).toString();
};

// Create a new block
export const createBlock = async (transactions: any[]): Promise<Block | null> => {
  try {
    // Get the latest block
    const { data: latestBlock, error: blockError } = await supabase
      .from('blockchain_blocks')
      .select('*')
      .order('block_number', { ascending: false })
      .limit(1)
      .single();
    
    if (blockError && blockError.code !== 'PGRST116') {
      console.error('Error fetching latest block:', blockError);
      return null;
    }
    
    const blockNumber = latestBlock ? latestBlock.block_number + 1 : 1;
    const previousHash = latestBlock ? latestBlock.current_hash : null;
    const timestamp = new Date().toISOString();
    
    // Prepare block data
    const blockData: BlockData = {
      transactions: transactions.map(tx => ({
        id: tx.id,
        sender_id: tx.sender_id,
        receiver_id: tx.receiver_id,
        amount: tx.amount,
        description: tx.description,
        transaction_type: tx.transaction_type,
        timestamp: tx.created_at
      })),
      timestamp
    };
    
    // Calculate hash
    const hash = calculateHash(blockNumber, previousHash, timestamp, blockData);
    
    // Create the new block
    const newBlock: Block = {
      blockNumber,
      timestamp,
      data: blockData,
      previousHash,
      hash
    };
    
    // Save to database
    const { data, error } = await supabase
      .from('blockchain_blocks')
      .insert({
        block_number: newBlock.blockNumber,
        timestamp: newBlock.timestamp,
        data: newBlock.data,
        current_hash: newBlock.hash,
        previous_hash: newBlock.previousHash
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving block:', error);
      return null;
    }
    
    // Update the transactions with the blockchain hash
    for (const tx of transactions) {
      await supabase
        .from('transactions')
        .update({ blockchain_hash: newBlock.hash })
        .eq('id', tx.id);
    }
    
    return {
      id: data.id,
      blockNumber: data.block_number,
      timestamp: data.timestamp,
      data: data.data,
      previousHash: data.previous_hash,
      hash: data.current_hash
    };
  } catch (error) {
    console.error('Error in createBlock:', error);
    return null;
  }
};

// Verify blockchain integrity
export const verifyBlockchain = async (): Promise<boolean> => {
  try {
    // Get all blocks in order
    const { data: blocks, error } = await supabase
      .from('blockchain_blocks')
      .select('*')
      .order('block_number', { ascending: true });
    
    if (error) {
      console.error('Error fetching blocks:', error);
      return false;
    }
    
    if (!blocks || blocks.length === 0) {
      // No blocks to verify
      return true;
    }
    
    // Verify each block
    for (let i = 1; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      const previousBlock = blocks[i - 1];
      
      // Check if hash is valid
      const calculatedHash = calculateHash(
        currentBlock.block_number,
        currentBlock.previous_hash,
        currentBlock.timestamp,
        currentBlock.data
      );
      
      if (currentBlock.current_hash !== calculatedHash) {
        console.error(`Block ${currentBlock.block_number} hash is invalid`);
        return false;
      }
      
      // Check if previous hash points to correct block
      if (currentBlock.previous_hash !== previousBlock.current_hash) {
        console.error(`Block ${currentBlock.block_number} previous hash is invalid`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in verifyBlockchain:', error);
    return false;
  }
};

// Get blockchain data for display
export const getBlockchainData = async (): Promise<Block[]> => {
  try {
    const { data, error } = await supabase
      .from('blockchain_blocks')
      .select('*')
      .order('block_number', { ascending: false });
    
    if (error) {
      console.error('Error fetching blockchain data:', error);
      return [];
    }
    
    return data.map(block => ({
      id: block.id,
      blockNumber: block.block_number,
      timestamp: block.timestamp,
      data: block.data,
      previousHash: block.previous_hash,
      hash: block.current_hash
    }));
  } catch (error) {
    console.error('Error in getBlockchainData:', error);
    return [];
  }
};

// Get transactions for a specific block
export const getTransactionsForBlock = async (blockId: string): Promise<any[]> => {
  try {
    const { data: block, error } = await supabase
      .from('blockchain_blocks')
      .select('*')
      .eq('id', blockId)
      .single();
    
    if (error) {
      console.error('Error fetching block:', error);
      return [];
    }
    
    return block.data.transactions || [];
  } catch (error) {
    console.error('Error in getTransactionsForBlock:', error);
    return [];
  }
};
