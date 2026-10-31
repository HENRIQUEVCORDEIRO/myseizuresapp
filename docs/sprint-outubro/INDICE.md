# Sprint de outubro/2026 — Painel

> Registro diário da sprint de rework de interface do MySeizures (20 → 30/out/2026).
> Cada dia tem um arquivo próprio. Este índice é o painel: **é ele que mostra, a cada dia, se o
> app está funcional e o que falta**.

**Plano completo:** [`docs/plano-geral-outubro-2026.md`](../plano-geral-outubro-2026.md) ·
**PMV:** [`docs/pmv-outubro-2026.md`](../pmv-outubro-2026.md) ·
**Protocolo de verificação:** §13 do plano geral

---

## 1. Níveis de verificação

| Nível | O que prova | Quem executa |
|---|---|---|
| **N0** | `npx expo export --platform android` — **o app empacota** | 🤖 agente |
| **N1** | `npm test` — suíte completa verde | 🤖 agente |
| **N2** | `npm run lint` + `npm run format:check` | 🤖 agente |
| **N3** | **teste novo** para a feature do dia (prova que funciona, não só que não quebrou) | 🤖 agente |
| **N4** | **no aparelho**, via `adb` — instalar, abrir, capturar tela e ler a imagem | 🤖 agente |
| **N5** | **na web** — `expo export --platform web` servido em `localhost` | 🤖 agente |
| **N6** | revisão humana pontual no aparelho: fonte dinâmica e toque real; **TalkBack já validado no D2, não repetir** | 👤 autor |

> **N6 é pontual, não diário.** O TalkBack foi validado uma vez no D2 (26/10) e não volta ao
> checklist recorrente. Todos os demais níveis são automatizados.

---

## 2. Painel dos dias

| Dia | Data | Entrega | N0 | N1 | N2 | N3 | N4 | N5 | N6 | Registro |
|---|---|---|---|---|---|---|---|---|---|---|
| **D1** | seg 20/10 | Documentação, design tokens, 10 primitivas de UI | — | ✅ 241 | ✅ | ✅ 17 | — | — | — | [d1](2026-10-20-d1.md) |
| **D2** | ter 21/10 | Tab bar (4 abas) + home do paciente + fechamento D2.1 (identidade, doses, datas PT-BR) | ✅ | ✅ 260 | ✅ | ✅ | ✅ | — | ✅ | [d2](2026-10-21-d2.md) |
| **D3** | qua 22/10 | Formulário de crise (agora, `ChoiceGroup`, `feltAura`) | ✅ | ✅ 267 | ✅ | ✅ | ✅ | — | — | [d3](2026-10-22-d3.md) |
| **D4** | qui 23/10 | Formulário de gatilho (agora, `SelectSheet` multi, sono/humor) | ✅ | ✅ 278 | ✅ | ✅ | ✅ | — | — | [d4](2026-10-23-d4.md) |
| **D5** | seg 26/10 | Assistente de tratamento em 3 passos + dose em 1 toque | ✅ | ✅ 287 | ✅ | ✅ | ✅ | — | — | [d5](2026-10-29-d5.md) |
| **W** | ter 27/10 | Trilha web: `react-native-web` + composição por plataforma | | | | | | ✅ | | |
| D6 | ter 27/10 | Home do profissional | | | | | | | | |
| D7 | qua 28/10 | Relatório unificado com export | | | | | | | | |
| D8 | qui 29/10 | Offline real, rascunho, `Undo`, métrica de auras | | | | | | | |
| D9 | sex 30/10 | Acessibilidade, rede de apoio, evidência, entrega | | | | | | | | |

**Legenda:** ✅ passou · ⏳ pendente · ⚠️ falhou · — não aplicável

---

## 3. Estado acumulado

| Métrica | D1 | D2 | D3 | D4 | Alvo em 30/10 |
|---|---|---|---|---|---|
| Suítes de teste | 38 | 43 | 43 | **43** | 46 |
| Testes | 241 | 260 | 267 | **287** | ~300 |
| Primitivas de UI | 10 | 10 | 10 | 10 | 12 |
| Linhas de código de apresentação | 6.670 | +420 | +30 | — | — |
| Documentos | 11 | 13 | 14 | **16** | 16 |
| Funcionalidades da matriz implementadas (parcial ou total) | 8/13 | 8/13 | 8/13 | **8/13** | 11/13 |

---

## 4. Arquivos prontos para commit

> O autor faz o commit manualmente. Os commits 1–10 do plano já estão no histórico
> (`git log --oneline`); esta seção lista **somente o que ainda está na árvore de trabalho**.

### 4.1 D2.1 — commitado

O fechamento D2.1 já está no histórico (`6e2d8c7`), incluindo identidade local, PT-BR, doses,
documentação e evidências. TalkBack validado pelo autor em 26/10.

### 4.2 D3 — commitado

O D3 está no histórico (`87aab8e` e `3f40493`), incluindo aura, horário atual, migração 003,
documentação e evidências. TalkBack validado no D2.

### 4.3 D4 — commitado

O D4 está no histórico (`b8b35c6` e `0df33cb`), incluindo formulário de gatilho, causas múltiplas,
migração 004, documentação e evidências. O TalkBack não foi repetido; permanece validado no D2.

### 4.4 D5 — na árvore de trabalho

| Área | Arquivos principais | Alterado | Motivo |
|---|---|---|---|
| Domínio e regras | `treatment.js`, `treatmentRules.js` | M | motivo, dose, período e filtro da agenda |
| Migração | `005_treatment_details.js`, `migrations/index.js` | A/M | colunas de motivo, dose e período |
| Persistência | `TreatmentRepository.js` | M | lê/grava os novos campos nos dois caminhos |
| Assistente | `mobile/app/(patient)/treatments/new.js` | M | fluxo em 3 passos, atalhos, datas e resumo |
| Home | `mobile/app/(patient)/(tabs)/index.js` | M | próxima dose e confirmação em 1 toque |
| Lista | `mobile/app/(patient)/(tabs)/treatments.js` | M | exibe motivo, dose e período |
| Componentes | `CalendarDateField.js`, `formatters/dateTime.js` | A/M | seletor de data e datas de calendário |
| Testes | domínio, regras, migração, repositório, formatadores, assistente e home | M | 287 testes verdes |
| Documentação | `2026-10-29-d5.md`, `INDICE.md`, `evidencias/d5/` | A/M | D5 e N0–N4; capturas e dump SQLite |

```bash
# Código do D5; o autor pode dividir em commits menores.
git add mobile
git commit -m "feat: add 3-step treatment wizard and one-tap dose confirmation"

# Evidências e resultado do N4.
git add docs/sprint-outubro/2026-10-29-d5.md docs/sprint-outubro/INDICE.md docs/sprint-outubro/evidencias/d5
git commit -m "docs(sprint): record D5 device checks"
```

**Fora dos commits:** `.specify/`, `prompts/`, `docs/instructions/`, `docs/fix_pesquisa_TCC.pdf`.

### 4.5 Próximo

O D5 está concluído em N0–N4 e pronto para o commit manual. Seguir para **D7/D8** e, quando
`react-native-web` estiver disponível, a trilha web (N5). A tradução PT-BR não é uma pendência
separada; identificadores, domínio, API e testes de domínio permanecem em inglês. A atualização
automática do fim do período em **Registros** e o safe area do botão **Confirmar** da sheet ficam
como melhorias de UX para D8.

**A** = adicionado · **M** = modificado · **R** = renomeado · **D** = removido

> **Não versionados por decisão do autor:** `docs/EBook - Experiencia_do_Usuario_em_Interfaces_
> Digitais.pdf` (copyright EDUFRN) e `docs/Fluxo - outro app epilepsia/` (UI de app comercial).
> Nesta rodada, também ficam fora dos commits a matriz `docs/fix_pesquisa_TCC.pdf`, o diretório
> `docs/instructions/` e as pastas de ferramenta `.specify/` e `prompts/`.
