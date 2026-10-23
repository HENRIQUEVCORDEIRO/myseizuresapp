# MySeizures — Design System

> Linguagem visual do produto: tokens, primitivas, padrões de tela, tom de voz e acessibilidade.
>
> **Status:** v1.0 · **Aprovado em:** 20/10/2026 · **Referência teórica:** Grilo, *Experiência do
> Usuário em Interfaces Digitais* (EDUFRN/UFRN) · **Implementação:** `mobile/src/presentation/theme/`

---

## 1. Princípios

Derivados do eBook e dos ADRs do projeto. Cada princípio tem uma consequência prática e
verificável.

### P1 — O mínimo de ações possível (carga cognitiva)

> *"Deve-se considerar o quanto a memória é exigida dos usuários (carga cognitiva) na realização de
> tarefas e se está sendo solicitado ao usuário mais do que o necessário."* — Cybis, Betiol &
> Faust (2015), via Grilo, cap. 3, p. 85

**Consequência:** todo campo obrigatório tem um valor padrão razoável (o mais comum é "agora"), e
todo campo opcional fica **fora** do caminho crítico. Nenhuma tela exige que o usuário **digite
ISO 8601**, **conte quantas vezes por dia** nem **lembre o formato** de nada.

### P2 — Affordance percebido, não apenas real (Norman, 1988)

> *"Se quisermos que algo na tela do computador pareça clicável, deve-se manipular essa figura para
> que ela tenha características que permitam esse affordance, utilizando efeitos visuais."* — Grilo,
> cap. 3, p. 76

**Consequência:** um controle interativo **sempre** tem sinalização de que é interativo — borda,
fundo distinto, elevação ou forma. Campos de texto têm borda; botões têm preenchimento; chips
selecionados têm preenchimento **e** marca.

### P3 — Status nunca por cor sozinha (W3C + constituição do projeto)

**Consequência:** qualquer estado (alerta, adesão, confirmação) é comunicado por **cor + rótulo
textual** (e, quando couber, ícone). O `ReportSummaryChart` já faz isso ("Bars are accompanied by
exact values and do not rely on colour alone"); o design system generaliza a regra.

### P4 — Consistência e padrões (Shneiderman 1986, Nielsen 1995)

**Consequência:** uma única `Button`, um único `Field`, um único `SegmentedControl`. Nenhuma tela
reimplementa um controle existente. É por isso que as telas de relatório e de export passam a
compartilhar a mesma peça de seleção de período.

### P5 — Prevenção de erros, não correção de erros (Nielsen 1995)

**Consequência:** validação no momento da escolha (não no submit), mensagens que dizem **o que
fazer**, e nenhum botão destrutivo sem confirmação.

### P6 — Visibilidade do status e reversão (Shneiderman 1986)

**Consequência:** toda operação tem três desfechos visíveis — *carregando*, *erro com ação de
recuperação*, *sucesso*. Ações destrutivas ou de esforço alto são reversíveis por um período
curto (`Undo`).

### P7 — Reconhecer em vez de lembrar (Nielsen 1995)

**Consequência:** o usuário escolhe entre opções visíveis (chips, botões de escolha, listas) em vez
de recuperar valores de memória. Listas longas (12 causas de gatilho, 5 tipos de crise) vão para
**bottom sheet com busca**, não para `<select>`.

### P8 — Acessibilidade como parte do produto, não como acessório (W3C)

**Consequência:** alvos de toque ≥ 48 dp, rótulos em todas as ações, `accessibilityLiveRegion` em
transições de estado, hierarquia semântica de títulos, e nenhuma informação transmitida apenas
por cor.

---

## 2. Tokens

Fonte única de verdade: `mobile/src/presentation/theme/tokens.js`. **Nenhuma cor, espaçamento ou
raio pode ser escrito à mão em uma tela** — só via token.

### 2.1 Cor

A paleta atual do projeto é mantida (decisão D-01): ela já é coerente e está espalhada em 12
`StyleSheet.create`. O que faltava era **tokenização**.

| Token | Valor | Uso |
|---|---|---|
| `color.brand.primary` | `#17324D` | Títulos, cabeçalhos, texto primário, ação secundária |
| `color.brand.action` | `#175CD3` | Botão primário, link, estado selecionado |
| `color.brand.actionPressed` | `#1849A9` | Estado pressionado da ação |
| `color.text.primary` | `#17324D` | Títulos e texto principal |
| `color.text.secondary` | `#334155` | Texto de apoio, descrições |
| `color.text.tertiary` | `#475467` | Metadados, legendas, rótulos de eixo |
| `color.text.inverse` | `#FFFFFF` | Texto sobre fundo de ação |
| `color.text.disabled` | `#94A3B8` | Texto em controle desabilitado |
| `color.surface.base` | `#FFFFFF` | Cartões, campos, folhas |
| `color.surface.subtle` | `#F8FAFC` | Fundo de tela |
| `color.surface.muted` | `#F1F5F9` | Superfícies secundárias, trilhos |
| `color.surface.pressed` | `#E8EEF5` | Estado pressionado de superfície |
| `color.border.default` | `#D0D5DD` | Borda de cartão e campo |
| `color.border.strong` | `#98A2B3` | Borda de campo em foco/erro |
| `color.border.focus` | `#175CD3` | Anel de foco |
| `color.status.success` | `#067647` | Aprovado, confirmado |
| `color.status.successBg` | `#ECFDF3` | Fundo de sucesso |
| `color.status.warning` | `#C2410C` | Alerta médio, atenção |
| `color.status.warningBg` | `#FFF7ED` | Fundo de alerta |
| `color.status.danger` | `#B42318` | Erro, recusa, validação |
| `color.status.dangerBg` | `#FEF3F2` | Fundo de erro |
| `color.status.info` | `#175CD3` | Informativo, ação secundária |
| `color.status.infoBg` | `#EFF8FF` | Fundo informativo |

**Regra de contraste:** texto principal sobre `surface.base` e sobre `surface.subtle` deve atingir
≥ 4.5:1; texto ≥ 18 px ou ≥ 14 px bold atinge ≥ 3:1. `color.text.tertiary` (`#475467`) sobre
`#F8FAFC` = **7.1:1** ✅. `color.text.disabled` (`#94A3B8`) sobre `#FFFFFF` = **2.6:1** — aceitável
apenas para conteúdo desabilitado, nunca para informação.

### 2.2 Espaçamento

Escala de 4: `xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32`. Todo padding/gap é múltiplo de 4.

### 2.3 Raio

| Token | Valor | Uso |
|---|---|---|
| `radius.sm` | `8` | Campo, chip, item de lista |
| `radius.md` | `12` | Botão, cartão |
| `radius.lg` | `16` | Folha inferior (bottom sheet) |
| `radius.pill` | `999` | Botão em pílula, chip selecionado, badge |

### 2.4 Tipografia

| Token | Tamanho / Peso | Uso |
|---|---|---|
| `type.display` | 32 / 700 | Título de tela |
| `type.title` | 28 / 700 | Título de seção |
| `type.subtitle` | 21 / 700 | Título de bloco |
| `type.bodyStrong` | 16 / 700 | Texto de ação, valor em destaque |
| `type.body` | 16 / 400 | Corpo de texto, labels de campo |
| `type.caption` | 14 / 600 | Legendas, metadados, notas |
| `type.micro` | 13 / 500 | Nota de rodapé, disclaimsers |

> `lineHeight` mínimo de 1.4× o tamanho — requisito de legibilidade para público com limitações
> neurológicas.

### 2.5 Alvo de toque e elevação

| Token | Valor |
|---|---|
| `touchTarget.min` | `48` (dp) — aplica-se a **todo** elemento interativo |
| `elevation.card` | sombra sutil `0 1 2 rgba(16,24,40,0.06)` + borda `border.default` |
| `elevation.sheet` | sombra `0 -4 16 rgba(16,24,40,0.12)` |

### 2.6 Movimento

Sem biblioteca de animação (dentro do prazo). Estados usam `opacity` via `Pressable` e
`accessibilityLiveRegion` para anunciar a mudança. **Movimento é opcional e nunca é o único sinal
de mudança.**

---

## 3. Primitivas

Implementadas em `mobile/src/presentation/components/ui/`. Contrato de API estável; telas **não**
passam a style objects para dentro das primitivas.

| Primitiva | Arquivo | API mínima |
|---|---|---|
| `Screen` | `Screen.js` | `title`, `subtitle`, `children`, `scroll` |
| `Card` | `Card.js` | `children`, `onPress`, `icon`, `title`, `accessory` |
| `Button` | `Button.js` | `title`, `onPress`, `variant` (`primary`\|`secondary`\|`ghost`\|`danger`), `busy`, `disabled`, `size` |
| `Chip` | `Chip.js` | `label`, `selected`, `onPress`, `icon` |
| `SegmentedControl` | `SegmentedControl.js` | `options[{label,value}]`, `value`, `onValueChange` |
| `ChoiceGroup` | `ChoiceGroup.js` | `options[{label,value,description}]`, `value`, `onValueChange`, `multiple` |
| `SelectSheet` | `SelectSheet.js` | `visible`, `title`, `options`, `value`/`values`, `onClose`, `onConfirm`, `allowOther` |
| `StatTile` | `StatTile.js` | `label`, `value`, `caption`, `tone` |
| `EmptyState` | `EmptyState.js` | `title`, `message`, `actionLabel`, `onAction`, `icon` |
| `Field` | `Field.js` | `label`, `value`, `onChangeText`, `error`, `hint`, `required` |

Regras comuns a todas:

1. Todo elemento interativo recebe `accessibilityRole` e `accessibilityLabel` adequados.
2. Todo elemento interativo tem `minHeight ≥ touchTarget.min` (48).
3. `disabled` e `busy` desabilitam o `Pressable` **e** são anunciados via `accessibilityState`.
4. Nenhuma primitiva importa regra de negócio. Elas recebem strings prontas.

### 3.1 Contrato de `SelectSheet`

É a peça que resolve o caso "causa = `OTHER` exige descrição" sem poluir o formulário:

- `allowOther` exibe o campo livre **apenas** quando a opção `OTHER` está selecionada.
- No modo `multiple`, o valor de retorno é `array`; no modo simples, `string`.
- A folha **não** fecha ao tocar fora: fecha por `onClose` explícito (botão X) ou `onConfirm`.
  Isso evita perda acidental de dados — requisito de P5.

---

## 4. Padrões de tela

### 4.1 Home

```
┌──────────────────────────────┐
│ Home                    [+]  │  ← cabeçalho + ação primária
│ Bem-vindo, {nome}            │
│                              │
│ ┌──────────────────────────┐ │
│ │ ⚡ Registrar crise        │ │  ← 3 ações grandes (alvo ≥ 88 dp)
│ │ Adicionar data, hora...  │ │
│ ├──────────────────────────┤ │
│ │ 🌙 Registrar gatilho     │ │
│ ├──────────────────────────┤ │
│ │ 💊 Confirmar dose        │ │
│ └──────────────────────────┘ │
│                              │
│ Minha semana                 │
│ [ Semana | Mês | Ano ]       │  ← SegmentedControl
│ ┌──────────────────────────┐ │
│ │ Resumo do período        │ │  ← StatTile
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

Regras: a home mostra **no máximo 3 ações primárias**; gráficos e listas vêm abaixo; nada exige
scroll para alcançar a ação principal.

### 4.2 Formulário

```
┌──────────────────────────────┐
│ ←  Nova crise                 │
│ "Bom restabelecimento.       │  ← microcopy empática + por quê
│  Detalhe o que puder."       │
│                              │
│ Quando?                      │
│ ┌──────────────────────────┐ │
│ │ Hoje, 21:47         [📅] │ │  ← valor padrão = agora
│ └──────────────────────────┘ │
│                              │
│ Tipo                         │
│ ┌──────────┐ ┌──────────┐   │
│ │ F focal  │ │ G gene.  │   │  ← ChoiceGroup (não <select>)
│ └──────────┘ └──────────┘   │
│                              │
│ Você sentiu que viria?       │
│ ( ○ Sim   ○ Não )            │
│                              │
│ ┌──────────────────────────┐ │
│ │        Salvar             │ │  ← pílula, desabilitado até válido
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

Regras: obrigatórios primeiro, opcionais depois (ou omitidos); botão de ação **fixo no rodapé**;
validação inline; microcopy explica o benefício do dado.

### 4.3 Wizard (tratamento)

Etapas: **1 Info → 2 Frequência → 3 Período**. Stepper no topo com estado (feito / atual / a fazer).
Rodapé com `Anterior` (contorno) e `Próximo` (pílula). O passo 2 resolve frequência + horários
(fecha o defeito do `baseTimes.join(', ')`). O passo 3 define a data de início.

### 4.4 Relatório

Cartões empilháveis (acordeão) por métrica: convulsões, gatilhos, adesão, indicadores, alertas.
Cada cartão traz **título + valor exato + nota de rodapé explicando a métrica** e os alertas
levam severidade, motivo e versão da regra **em texto**.

Disclaimer fixo no rodapé:

> *Estes indicadores são informativos. Não são diagnósticos, orientação de emergência nem
> substituto do julgamento clínico. Converse qualquer mudança de tratamento com o seu médico.*

### 4.5 Estados

Toda tela com dados implementa os cinco estados: `loading`, `empty`, `error` (com ação de
recuperação), `forbidden` (sem revelar dados) e `success`. O componente `ApplicationState`
(existente) cobre isso e será migrado para usar os tokens.

---

## 5. Tom de voz

Derivado do cap. 4 do eBook (Linguagem e Comunicação) e da observação do app de referência
(*"Good recovery! Detail this seizure as well as possible. It could help yourself and your medical
team."*).

**Cinco regras:**

1. **Acolhedora, nunca acusatória.** O usuário pode ter esquecido. O texto nunca blames.
2. **Explica o porquê.** Cada campo opcional diz para que serve, em uma linha.
3. **Sem jargão clínico no fluxo do paciente.** Termos técnicos ficam nos relatórios, para o
   profissional.
4. **Curta.** Uma ideia por mensagem. Sem "Por favor, considere que…".
5. **Transparente sobre limites.** O app diz o que não faz: não é diagnóstico, não é substituto
   de consulta, o export não é enviado a lugar nenhum.

**Exemplos de microcopy aprovadas:**

| Contexto | Texto |
|---|---|
| Ao abrir o registro de crise | "Bom restabelecimento. Detalhe o que puder — isso ajuda você e a sua equipe médica." |
| Campo "duração" (opcional) | "Se você souber, quanto tempo durou." |
| Adesão sem confirmações | "Ainda não há doses confirmadas neste período." |
| Alerta médio | "A adesão registrada está abaixo de 80%. Este é um indicador informativo, não um diagnóstico." |
| Export concluído | "Arquivo salvo neste dispositivo. Nada foi enviado para o RNDS, o e-SUS ou qualquer outro serviço." |
| Acesso negado | "Este paciente não concedeu acesso a você. Nenhuma informação clínica está disponível." |

---

## 6. Acessibilidade — checklist de componente

Obrigatório para toda primitiva e toda tela:

- [ ] `accessibilityRole` em todo elemento interativo
- [ ] `accessibilityLabel` descritivo ("Marcar lembrete 3 como tomado", não "botão")
- [ ] `accessibilityHint` quando a consequência não for óbvia
- [ ] `accessibilityState` refletindo `disabled`, `busy`, `selected`, `checked`
- [ ] Alvo ≥ 48 dp em **todas** as direções
- [ ] `accessibilityLiveRegion="polite"` em transições de estado não críticas;
      `"assertive"` em erro
- [ ] Hierarquia de títulos com `accessibilityRole="header"`
- [ ] Nenhuma informação só por cor (P3)
- [ ] Nenhum texto abaixo de 13 px
- [ ] Contraste ≥ 4.5:1 para texto normal
- [ ] Ordem de foco e ordem de leitura = ordem visual
- [ ] `accessibilityLabel` em gráficos descrevendo os **valores**, não só o tipo

**Teste automatizado:** `mobile/tests/unit/presentation/uiPrimitives.test.js` verifica
papéis, estados, alvos e ausência de informação exclusiva por cor. A aceitação com TalkBack /
VoiceOver, fonte dinâmica e alvos de toque permanece **manual** e registrada em
`docs/usability-study-protocol.md`.

---

## 7. Checklist de revisão de tela

Antes de dar uma tela por pronta:

- [ ] Nenhuma cor/medida escrita à mão — só tokens
- [ ] Usa primitivas existentes; nenhuma reimplementação local de botão/campo
- [ ] Estados `loading` / `empty` / `error` / `forbidden` implementados
- [ ] Ação principal alcançável sem scroll
- [ ] Campos obrigatórios têm valor padrão razoável
- [ ] Validação inline com mensagem que diz o que fazer
- [ ] Microcopy no tom de voz da §5
- [ ] Checklist de acessibilidade da §6 inteiro
- [ ] Teste de apresentação adicionado ou atualizado
- [ ] `npm run lint` e `npm test` verdes

---

## 8. Referências

> A obra de Grilo e as capturas do app de referência são **material local, não versionado** (ver
> `.gitignore`). As citações abaixo seguem a ficha bibliográfica e servem para o artigo do TCC.

- GRILO, André. *Experiência do Usuário em Interfaces Digitais*. Natal: EDUFRN/UFRN.
- NIELSEN, J. (1995). *10 Usability Heuristics for User Interface Design*. Nielsen Norman Group.
- SHNEIDERMAN, B. (1986). *Eight golden rules for designing interactive systems*.
- NORMAN, D. A. *The Design of Everyday Things*. Affordance real × percebido.
- ISO 9241-11:2018 (usabilidade) · ISO 9241-210:2019 (experiência do usuário).
- W3C. *Web Content Accessibility Guidelines (WCAG)*.
- `docs/architecture.md` · `docs/adr/0001` · `docs/adr/0002` · `docs/reference-app-analysis.md`
