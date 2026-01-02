#!/usr/bin/env node
/**
 * Script para gerar portas aleatórias e atualizar .env
 */

const fs = require('fs');
const path = require('path');

// Função para gerar porta aleatória entre 10000 e 65535
function generateRandomPort() {
  return Math.floor(Math.random() * (65535 - 10000 + 1)) + 10000;
}

// Função para verificar se porta está disponível (simulação)
function isPortAvailable(port) {
  // Portas comuns a evitar
  const reservedPorts = [
    5432, 6379, 3000, 3306, 8080, 80, 443, 22, 21, 25, 587, 465, 143, 993, 110, 995,
    27017, 9200, 5601, 9092, 2181, 8081, 8443, 9000, 5000, 4000, 5001
  ];
  return !reservedPorts.includes(port);
}

// Gerar portas
let postgresPort = generateRandomPort();
while (!isPortAvailable(postgresPort)) {
  postgresPort = generateRandomPort();
}

let redisPort = generateRandomPort();
while (!isPortAvailable(redisPort) || redisPort === postgresPort) {
  redisPort = generateRandomPort();
}

// Porta do Next.js (pode ser aleatória também)
const nextjsPort = process.env.PORT || 3000;

console.log('\n🔧 Gerando portas aleatórias para evitar conflitos...\n');
console.log(`✅ PostgreSQL: ${postgresPort}`);
console.log(`✅ Redis: ${redisPort}`);
console.log(`✅ Next.js: ${nextjsPort}\n`);
console.log('💡 Essas portas serão usadas no docker-compose.yml e .env\n');

// Caminho do .env
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

// Ler .env existente ou criar novo
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf-8');
} else if (fs.existsSync(envExamplePath)) {
  envContent = fs.readFileSync(envExamplePath, 'utf-8');
}

// Atualizar ou adicionar variáveis de porta
const lines = envContent.split('\n');
const newLines = [];
const seen = new Set();

for (const line of lines) {
  const trimmed = line.trim();
  
  // Pular linhas vazias e comentários (mas manter comentários)
  if (!trimmed) {
    newLines.push(line);
    continue;
  }
  
  if (trimmed.startsWith('#')) {
    newLines.push(line);
    continue;
  }
  
  // Processar variáveis de porta
  if (trimmed.startsWith('POSTGRES_PORT=')) {
    if (!seen.has('POSTGRES_PORT')) {
      newLines.push(`POSTGRES_PORT=${postgresPort}`);
      seen.add('POSTGRES_PORT');
    }
  } else if (trimmed.startsWith('REDIS_PORT=')) {
    if (!seen.has('REDIS_PORT')) {
      newLines.push(`REDIS_PORT=${redisPort}`);
      seen.add('REDIS_PORT');
    }
  } else if (trimmed.startsWith('DATABASE_URL=')) {
    if (!seen.has('DATABASE_URL')) {
      const newDbUrl = `DATABASE_URL="postgresql://financeiro:financeiro123@localhost:${postgresPort}/financeiro_db?schema=public"`;
      newLines.push(newDbUrl);
      seen.add('DATABASE_URL');
    }
  } else if (trimmed.startsWith('REDIS_URL=')) {
    if (!seen.has('REDIS_URL')) {
      const newRedisUrl = `REDIS_URL="redis://localhost:${redisPort}"`;
      newLines.push(newRedisUrl);
      seen.add('REDIS_URL');
    }
  } else {
    // Manter outras variáveis
    const key = trimmed.split('=')[0];
    if (!seen.has(key)) {
      newLines.push(line);
      seen.add(key);
    }
  }
}

// Adicionar variáveis que não existem
if (!seen.has('POSTGRES_PORT')) {
  newLines.push(`POSTGRES_PORT=${postgresPort}`);
}
if (!seen.has('REDIS_PORT')) {
  newLines.push(`REDIS_PORT=${redisPort}`);
}
if (!seen.has('DATABASE_URL')) {
  newLines.push(`DATABASE_URL="postgresql://financeiro:financeiro123@localhost:${postgresPort}/financeiro_db?schema=public"`);
}
if (!seen.has('REDIS_URL')) {
  newLines.push(`REDIS_URL="redis://localhost:${redisPort}"`);
}

// Adicionar outras variáveis necessárias se não existirem
if (!seen.has('JWT_SECRET')) {
  newLines.push('JWT_SECRET="seu-jwt-secret-super-seguro-aqui-altere-em-producao"');
}
if (!seen.has('NODE_ENV')) {
  newLines.push('NODE_ENV="development"');
}

// Escrever .env
fs.writeFileSync(envPath, newLines.join('\n') + '\n');

console.log('✅ Arquivo .env atualizado com portas aleatórias!');
console.log(`\n📝 Arquivo: ${envPath}`);
console.log('\n💡 Dica: Execute "docker-compose up -d" para iniciar os containers com as novas portas.\n');

