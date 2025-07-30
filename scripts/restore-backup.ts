#!/usr/bin/env tsx

/**
 * Database Backup Restore Script
 * Restaura um backup do banco de dados PostgreSQL
 */

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface RestoreConfig {
  backupFilePath: string;
  verbose?: boolean;
  skipConfirmation?: boolean;
}

class DatabaseRestore {
  private dbUrl: string;
  private dbHost: string;
  private dbPort: string;
  private dbName: string;
  private dbUser: string;
  private dbPassword: string;

  constructor() {
    this.dbUrl = process.env.DATABASE_URL || '';
    if (!this.dbUrl) {
      throw new Error('DATABASE_URL não encontrada nas variáveis de ambiente');
    }

    const dbUrlParts = new URL(this.dbUrl);
    this.dbHost = dbUrlParts.hostname;
    this.dbPort = dbUrlParts.port || '5432';
    this.dbName = dbUrlParts.pathname.slice(1);
    this.dbUser = dbUrlParts.username;
    this.dbPassword = dbUrlParts.password;
  }

  private async confirmRestore(): Promise<boolean> {
    return new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      console.log('\n⚠️  ATENÇÃO: Esta operação irá SOBRESCREVER todos os dados atuais do banco!');
      console.log(`Database: ${this.dbName}`);
      console.log(`Host: ${this.dbHost}:${this.dbPort}`);
      
      rl.question('\nTem certeza de que deseja continuar? (digite "CONFIRMO" para continuar): ', (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase() === 'confirmo');
      });
    });
  }

  async restore(config: RestoreConfig): Promise<void> {
    const { backupFilePath, verbose = true, skipConfirmation = false } = config;

    // Verificar se o arquivo existe
    if (!existsSync(backupFilePath)) {
      throw new Error(`Arquivo de backup não encontrado: ${backupFilePath}`);
    }

    if (verbose) {
      console.log('🔄 Iniciando restauração do backup...');
      console.log(`📁 Arquivo: ${backupFilePath}`);
      console.log(`🗄️  Database: ${this.dbName}`);
    }

    // Confirmação de segurança
    if (!skipConfirmation) {
      const confirmed = await this.confirmRestore();
      if (!confirmed) {
        console.log('❌ Restauração cancelada pelo usuário.');
        return;
      }
    }

    return new Promise((resolve, reject) => {
      // Argumentos para o psql
      const psqlArgs = [
        '--host', this.dbHost,
        '--port', this.dbPort,
        '--username', this.dbUser,
        '--dbname', this.dbName,
        '--file', backupFilePath,
        '--single-transaction', // Executa tudo em uma transação
        '--set', 'ON_ERROR_STOP=on' // Para na primeira erro
      ];

      if (verbose) {
        psqlArgs.push('--verbose');
      }

      // Configurar ambiente
      const env = { 
        ...process.env, 
        PGPASSWORD: this.dbPassword 
      };

      if (verbose) {
        console.log('🚀 Executando restauração...');
      }

      const psql = spawn('psql', psqlArgs, { env });

      let output = '';
      let errorOutput = '';

      psql.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        if (verbose) {
          console.log(text.trim());
        }
      });

      psql.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        if (verbose) {
          console.error(text.trim());
        }
      });

      psql.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Restauração concluída com sucesso!');
          console.log(`📊 Dados restaurados de: ${backupFilePath}`);
          resolve();
        } else {
          console.error('❌ Erro durante a restauração:');
          console.error(errorOutput);
          reject(new Error(`psql exited with code ${code}: ${errorOutput}`));
        }
      });

      psql.on('error', (error) => {
        console.error('❌ Erro ao executar psql:', error.message);
        reject(error);
      });
    });
  }
}

// Função principal
async function main() {
  try {
    const args = process.argv.slice(2);
    
    // Configurações padrão
    let backupFilePath = './backups/restore/backup_qservicos_20250730_2025-07-30.sql';
    let verbose = true;
    let skipConfirmation = false;

    // Processar argumentos da linha de comando
    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '--file':
        case '-f':
          backupFilePath = args[i + 1];
          i++;
          break;
        case '--quiet':
        case '-q':
          verbose = false;
          break;
        case '--yes':
        case '-y':
          skipConfirmation = true;
          break;
        case '--help':
        case '-h':
          console.log(`
Uso: tsx scripts/restore-backup.ts [opções]

Opções:
  -f, --file <arquivo>    Caminho para o arquivo de backup (padrão: backup mais recente)
  -q, --quiet            Modo silencioso (menos output)
  -y, --yes              Pula confirmação (CUIDADO!)
  -h, --help             Mostra esta ajuda

Exemplos:
  tsx scripts/restore-backup.ts
  tsx scripts/restore-backup.ts -f ./backups/meu-backup.sql
  tsx scripts/restore-backup.ts -y -q -f ./backups/backup.sql
          `);
          return;
      }
    }

    console.log('🗄️  Qserviços - Restaurador de Backup do Banco de Dados');
    console.log('=' .repeat(60));

    const restorer = new DatabaseRestore();
    await restorer.restore({
      backupFilePath,
      verbose,
      skipConfirmation
    });

  } catch (error) {
    console.error('💥 Erro fatal:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export { DatabaseRestore };