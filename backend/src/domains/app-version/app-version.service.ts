import { Injectable, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { spawn } from 'child_process';
import { Company } from '../companies/entities/company.entity';
import { CompanyMember } from '../companies/entities/company-member.entity';
import * as path from 'path';

const PKG_VERSION = require('../../../package.json').version;

function parseVersion(v: string): number[] {
  const match = (v || '0.0.0').replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return [0, 0, 0];
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

function isNewer(available: string, current: string): boolean {
  const a = parseVersion(available);
  const c = parseVersion(current);
  for (let i = 0; i < 3; i++) {
    if (a[i] > c[i]) return true;
    if (a[i] < c[i]) return false;
  }
  return false;
}

@Injectable()
export class AppVersionService implements OnModuleInit {
  constructor(
    @InjectRepository(Company)
    private companiesRepository: Repository<Company>,
    @InjectRepository(CompanyMember)
    private membersRepository: Repository<CompanyMember>,
  ) {}

  private async getEmpresaAtualizacao(): Promise<Company | null> {
    return this.companiesRepository.findOne({
      where: {},
      order: { createdAt: 'ASC' },
    });
  }

  async getCurrentVersion(): Promise<string> {
    const row = await this.getEmpresaAtualizacao();
    return row?.empVer || PKG_VERSION;
  }

  async getStatusAtualizacao(): Promise<{ concluida: boolean }> {
    const row = await this.getEmpresaAtualizacao();
    if (!row) return { concluida: true };
    const emAndamento = row.empAttDtaHorIni != null && row.empAttDtaHorFim == null;
    return { concluida: !emAndamento };
  }

  async podeAtualizar(userId: string): Promise<boolean> {
    const member = await this.membersRepository.findOne({
      where: { userId, isActive: true },
      relations: ['company'],
    });
    if (!member || member.role !== 'admin') return false;

    const permitidos = process.env.COMPANY_IDS_ATUALIZACAO;
    if (permitidos) {
      const ids = permitidos.split(',').map((s) => s.trim()).filter(Boolean);
      if (ids.length > 0 && !ids.includes(member.companyId)) return false;
    }
    return true;
  }

  async buscarAtualizacoes(userId: string): Promise<{
    temNova: boolean;
    versaoAtual: string;
    versaoDisponivel?: string;
    mensagem: string;
  }> {
    const pode = await this.podeAtualizar(userId);
    if (!pode) {
      throw new HttpException('Sem permissão para buscar atualizações', HttpStatus.FORBIDDEN);
    }

    const repo = process.env.GITHUB_REPO || 'jaspisistemas/hub';
    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    let tagName = '';
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers });
      if (!res.ok) {
        return {
          temNova: false,
          versaoAtual: await this.getCurrentVersion(),
          mensagem: 'Não foi possível verificar atualizações no GitHub',
        };
      }
      const data = await res.json();
      tagName = (data.tag_name || '').replace(/^v/, '');
    } catch (err) {
      return {
        temNova: false,
        versaoAtual: await this.getCurrentVersion(),
        mensagem: 'Erro ao conectar ao GitHub',
      };
    }

    const row = await this.getEmpresaAtualizacao();
    const current = row?.empVer || PKG_VERSION;
    const temNova = isNewer(tagName, current);

    if (temNova && row) {
      row.empAttIs = true;
      row.empAttDisp = tagName;
      await this.companiesRepository.save(row);
    }

    return {
      temNova,
      versaoAtual: current,
      versaoDisponivel: temNova ? tagName : undefined,
      mensagem: temNova ? `Nova versão ${tagName} disponível` : 'Sistema está atualizado',
    };
  }

  async executarAtualizacao(userId: string): Promise<{ message: string }> {
    const pode = await this.podeAtualizar(userId);
    if (!pode) {
      throw new HttpException('Sem permissão para executar atualização', HttpStatus.FORBIDDEN);
    }

    const infraPathRaw = process.env.INFRA_PATH?.trim();
    if (!infraPathRaw) {
      throw new HttpException('INFRA_PATH não configurado no servidor. Contate o suporte.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const fs = await import('fs');
    const infraPath = path.resolve(infraPathRaw);
    const batPath = path.join(infraPath, 'deploy-atualizar.bat');

    if (!fs.existsSync(infraPath)) {
      throw new HttpException(`Pasta INFRA_PATH não encontrada: ${infraPath}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    if (!fs.existsSync(batPath)) {
      throw new HttpException(`deploy-atualizar.bat não encontrado em: ${batPath}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const row = await this.getEmpresaAtualizacao();
    if (!row) {
      throw new HttpException('Nenhuma empresa cadastrada para atualização', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    row.empAttDtaHorIni = new Date();
    row.empAttDtaHorFim = undefined;
    await this.companiesRepository.save(row);

    // Dispara o bat (que chama powershell deploy-atualizar.ps1 /AUTO)
    const spawnOpts = {
      detached: true,
      stdio: 'ignore' as const,
      windowsHide: false,
    };

    return new Promise<{ message: string }>((resolve, reject) => {
      let child: ReturnType<typeof spawn>;
      if (process.platform === 'linux' && /^[A-Za-z]:[\\/]/.test(infraPathRaw)) {
        const cmdExe = '/mnt/c/Windows/System32/cmd.exe';
        const batPathWin = infraPath.replace(/\//g, '\\').replace(/\\$/, '') + '\\deploy-atualizar.bat';
        child = spawn(cmdExe, ['/c', batPathWin, '/AUTO'], spawnOpts);
      } else if (process.platform === 'win32') {
        const batPathEscaped = batPath.replace(/\\/g, '/').replace(/"/g, '""');
        child = spawn('cmd.exe', ['/c', `start "" /MIN "${batPathEscaped}" /AUTO`], {
          ...spawnOpts,
          shell: true,
        });
      } else {
        const cmdLine = `"${batPath.replace(/"/g, '""')}" /AUTO`;
        child = spawn(cmdLine, [], { ...spawnOpts, shell: true });
      }

      child.on('error', (err) => {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        reject(new HttpException(`Falha ao iniciar atualização: ${msg}`, HttpStatus.INTERNAL_SERVER_ERROR));
      });
      child.on('spawn', () => {
        child.unref();
        resolve({
          message: 'Atualização iniciada. O sistema será reiniciado em alguns minutos.',
        });
      });
    });
  }

  async getVersaoNovaStatus(userId: string): Promise<{
    hasNovaVersao: boolean;
    versaoDisponivel: string | null;
    podeAtualizar: boolean;
  }> {
    const podeAtualizar = await this.podeAtualizar(userId);
    const row = await this.getEmpresaAtualizacao();
    return {
      hasNovaVersao: row?.empAttIs ?? false,
      versaoDisponivel: row?.empAttDisp ?? null,
      podeAtualizar,
    };
  }

  async onModuleInit(): Promise<void> {
    await this.marcarAtualizacaoConcluida();
  }

  async marcarAtualizacaoConcluida(): Promise<void> {
    const row = await this.getEmpresaAtualizacao();
    if (!row) return;

    let changed = false;

    // Atualização em andamento: marca como concluída e grava nova versão
    if (row.empAttDtaHorIni && !row.empAttDtaHorFim) {
      row.empAttDtaHorFim = new Date();
      if (row.empAttDisp) {
        row.empVer = row.empAttDisp;
        row.empAttIs = false;
        row.empAttDisp = undefined;
      }
      changed = true;
    }

    // Sincroniza empVer com a versão real do package.json (deploy via bat, manual, etc.)
    const versaoAtual = row.empVer || '';
    if (versaoAtual !== PKG_VERSION) {
      row.empVer = PKG_VERSION;
      changed = true;
    }

    if (changed) {
      await this.companiesRepository.save(row);
    }
  }
}
