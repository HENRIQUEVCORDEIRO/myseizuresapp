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
| **N6** | revisão humana no aparelho: TalkBack, fonte dinâmica, toque real | 👤 autor |

> **N6 é a única verificação que exige o autor.** Todos os demais níveis são automatizados.

---

## 2. Painel dos dias

| Dia | Data | Entrega | N0 | N1 | N2 | N3 | N4 | N5 | N6 | Registro |
|---|---|---|---|---|---|---|---|---|---|---|
| **D1** | seg 20/10 | Documentação, design tokens, 10 primitivas de UI | — | ✅ 241 | ✅ | ✅ 17 | — | — | — | [d1](2026-10-20-d1.md) |
| **D2** | ter 21/10 | Tab bar (4 abas) + home do paciente + fechamento D2.1 (identidade, doses, datas PT-BR) | ✅ | ✅ 260 | ✅ | ✅ | ✅ | — | ⏳ | [d2](2026-10-21-d2.md) |
| D3 | qua 22/10 | Formulário de crise | | | | | | | | |
| D4 | qui 23/10 | Formulário de gatilho | | | | | | | | |
| D5 | seg 26/10 | Assistente de tratamento em 3 passos | | | | | | | | |
| **W** | ter 27/10 | Trilha web: `react-native-web` + composição por plataforma | | | | | | ✅ | | |
| D6 | ter 27/10 | Home do profissional | | | | | | | | |
| D7 | qua 28/10 | Relatório unificado com export | | | | | | | | |
| D8 | qui 29/10 | Offline real, rascunho, `Undo`, métrica de auras | | | | | | | |
| D9 | sex 30/10 | Acessibilidade, rede de apoio, evidência, entrega | | | | | | | | |

**Legenda:** ✅ passou · ⏳ pendente · ⚠️ falhou · — não aplicável

---

## 3. Estado acumulado

| Métrica | D1 | D2 | Alvo em 30/10 |
|---|---|---|---|
| Suítes de teste | 38 | **43** | 46 |
| Testes | 241 | **260** | ~300 |
| Primitivas de UI | 10 | 10 | 12 |
| Linhas de código de apresentação | 6.670 | +420 | — |
| Documentos | 11 | **13** | 16 |
| Funcionalidades da matriz implementadas (parcial ou total) | 8/13 | 8/13 | 11/13 |

---

## 4. Arquivos prontos para commit

> O autor faz o commit manualmente. Os commits 1–10 do plano já estão no histórico
> (`git log --oneline`); esta seção lista **somente o que ainda está na árvore de trabalho**.

### 4.1 Fechamento D2.1

| Área | Arquivos principais | Alterado | Motivo |
|---|---|---|---|
| Identidade e API | `api/src/routes/authRoutes.js`, `api/src/services/AuthService.js`, `api/tests/authentication.test.js`, `api/tests/integration/auth.test.js` | M | payload seguro de identidade e contrato coberto |
| Identidade local | `RestClient.js`, `SignIn.js`, `SessionStore.js`, `LocalIdentityRepository.js`, `container.js`, `AuthSessionProvider.js`, `localIdentity.test.js` | M/A | sync idempotente de `users`/`patients` após login/restore |
| Doses e lembretes | `reminders.js`, `ManageTreatment.js`, `treatmentRules.js`, `TreatmentRepository.js`, `ExpoNotificationService.js`, `reminders.test.js` | M | crash corrigido, loading/erro, notificação não fatal e fuso local |
| Datas/horas e formulários | `formatters/dateTime.js`, `NativeDateTimeField.js`, `TimeListField.js`, telas de crise/gatilho/tratamento/calendário/relatórios, `dateTimeFormatter.test.js`, `treatmentForm.test.js` | M/A | formatter PT-BR, seletores nativos e horários |
| PT-BR | telas de navegação, auth, home, calendário, tratamentos, doses, compartilhamento, relatórios e testes de apresentação | M | tradução integral da UI, sem i18n |
| Acessibilidade | `_layout.js` das abas, `ClinicalEventItem.js`, `ClinicalAlertList.js`, `sharing.js`, testes de acessibilidade/calendário/navegação | M | safe area, `listitem` inválido no Android e rótulos em 1,3× |
| Documentação | `docs/sprint-outubro/2026-10-21-d2.md`, `INDICE.md`, `evidencias/d2/*` (26 arquivos) | M/A | resultados, achados e capturas do reteste |

```bash
# Sugestão de agrupamento; o autor pode dividir em commits menores.
git add api mobile
git commit -m "fix: close D2 with local identity, PT-BR and stable reminders"

git add docs/sprint-outubro/2026-10-21-d2.md docs/sprint-outubro/INDICE.md docs/sprint-outubro/evidencias/d2
git commit -m "docs(sprint): record the D2 device verification"
```

**Fora dos commits:** `.specify/`, `prompts/`, `docs/instructions/`, `docs/fix_pesquisa_TCC.pdf`.

### 4.2 Próximo

Com o D2 fechado, retomar D3/D4/D5 e a trilha web (N5) depois do commit manual. A tradução PT-BR
não é mais uma pendência separada; identificadores, domínio, API e testes de domínio permanecem em
inglês.

**A** = adicionado · **M** = modificado · **R** = renomeado · **D** = removido

> **Não versionados por decisão do autor:** `docs/EBook - Experiencia_do_Usuario_em_Interfaces_
> Digitais.pdf` (copyright EDUFRN) e `docs/Fluxo - outro app epilepsia/` (UI de app comercial).
> Nesta rodada, também ficam fora dos commits a matriz `docs/fix_pesquisa_TCC.pdf`, o diretório
> `docs/instructions/` e as pastas de ferramenta `.specify/` e `prompts/`.
