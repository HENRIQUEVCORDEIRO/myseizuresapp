# Protocolo do Estudo de Usabilidade — MySeizures

> Roteiro, termo de consentimento, métricas e modo de reportar os resultados do teste que valida
> as SC-001, SC-002 e SC-003.
>
> **Status:** v1.0 · **Data:** 20/10/2026 · **Sprint de execução:** novembro de 2026
> **Relacionado:** `docs/plano-geral-outubro-2026.md` · `specs/001-manage-epilepsy-care/spec.md` ·
> `docs/visual-design-system.md`

---

## 1. Por que este estudo é o resultado do artigo

Os critérios de sucesso da especificação **já são métricas de teste de usabilidade**. O
`traceability.md` registra SC-001, SC-002 e SC-003 como **NOT MEASURED** — e é exatamente isso que
a seção "Resultados" do artigo precisa conter.

| Spec | Critério | Tarefa correspondente |
|---|---|---|
| SC-001 | 90% registram uma crise com todos os detalhes em **< 60 s** | Tarefa A |
| SC-002 | 90% criam tratamento e confirmam dose em **< 2 min** | Tarefa B |
| SC-003 | Profissional encontra alertas e adesão em **< 1 min** | Tarefa C |
| SC-004 | 100% de acessos negados após revogação; 100% de exports corretos | Tarefa D |
| SC-005 | 100% das entradas offline sobrevivem à reabertura | Tarefa E |

**Hipótese declarada (H1):** após o rework de interface, ≥ 90% dos participantes conclude a Tarefa A
em menos de 60 segundos, ≥ 90% conclui a Tarefa B em menos de 2 minutos e 100% dos profissionais
encontram alertas e adesão em menos de 1 minuto.

---

## 2. Objetivos e escopo

**Objetivo principal** — avaliar a eficiência e a eficácia do MySeizures nas tarefas centrais das
duas personas, medindo tempo de conclusão, taxa de sucesso e erros.

**Objetivos secundários**
- Verificar a acessibilidade na prática (leitor de tela, fonte dinâmica, alvos de toque).
- Identificar atrito de baixa frequência que os testes automatizados não detectam.
- Produzir evidência redigida para o artigo e para a defesa.

**Fora do escopo**
- Avaliação clínica: os alertas são **informativos** e não são diagnosticados.
- Comparação quantitativa com os concorrentes — o estudo não é benchmark.
- Validação em produção, com dados reais. **Somente dados sintéticos.**

---

## 3. Participantes

| Perfil | N recomendado | Recrutamento | Perfil de fundo |
|---|---|---|---|
| Paciente (P) | 5 – 8 | Pessoas com epilepsia diagnosticada, ou cuidadores/familiares que convivem com o uso de medicação | Usuário real do produto, não enviesado por familiaridade técnica |
| Profissional (M) | 2 – 3 | Neur Logging, residente, enfermeiro de UBS, cuidador profissional | Usuário derelatórios, não necessariamente técnico |
| Observador (O) | 1 | Moderador, não conduz | — |

**Justificativa do N:** para tarefas binárias (sucesso/fracasso) o estimador de proporção com
N = 5–8 por perfil já permite detectar se a taxa de sucesso está **materialmente** abaixo de 90%
(por exemplo, 4 de 5 = 80%, reprova o critério). Com N menor, o resultado é **descritivo**, não
inferencial — e o artigo deve declarar isso explicitamente.

**Recrutamento e ética**
- Convite por instituições e grupos de pacientes; sem pressão de recrutamento.
- **Exclusão** de quem participou do desenvolvimento do app.
- Compensação: se houver, deve ser documentada e igual para todos.
- **Somente dados sintéticos.** Nenhum dado real de paciente entra no dispositivo do teste.

---

## 4. Materiais

1. **Aparelho**: Android físico, com *development build* do MySeizures (o `expo-dev-client` é
   obrigatório — `expo-notifications` não funciona no Expo Go desde o SDK 53).
2. **Ambiente**: API simulada rodando na mesma rede; base SQLite **limpa e semeada** com um
   conjunto mínimo de dados sintéticos coerente (ver §6).
3. **Roteiro impresso** (não na tela) com as tarefas e as perguntas.
4. **Gravador de tela e áudio** com consentimento.
5. **Questionário SUS** (10 itens) impresso.
6. **Termo de consentimento e autorização de gravação** (modelo na §9).

---

## 5. Roteiro de tarefas

Cada participante executa as tarefas **na ordem** abaixo, com **think-aloud**. O moderador não
intervém, exceto quando a pessoa travou por mais de 90 s ou pede ajuda explicitamente — nesses
casos registra-se "assistida" e a tarefa é contada como **falha** para efeito de SC.

### 5.1 Contexto antes de começar (para todos)

> "Esta é uma versão de protótipo de um app para registrar crises e medicação. Ele funciona
> offline, então não se preocupe com internet. Os dados aqui são fictícios. Por favor, **pense em
> voz alta** enquanto usa, e me diga o que espera que aconteça. Se algo estiver confuso, diga
> 'estou confuso' — isso é útil, não é um erro seu."

### 5.2 Tarefa A — Registrar uma crise (SC-001, < 60 s)

> "Imagine que você teve uma crise hoje à tarde, por volta das 15h, do tipo **focal**. Registre
> essa crise no app."

**Métrica**: tempo até a mensagem de confirmação; número de toques; erros; besoin de ajuda.
**Nota**: a hora **não** precisa ser digitada — é o que se está medindo.

### 5.3 Tarefa B — Criar tratamento e confirmar a dose (SC-002, < 2 min)

> "Você toma um medicamento chamado **Aspirina 500 mg**, uma vez ao dia, pela **manhã**. Crie esse
> tratamento no app e confirme a dose de hoje como **tomada**."

**Métrica**: tempo total (criar + confirmar); erros na creation de horários; necessidade de ajuda.
**Nota**: se a pessoa travar no campo de horários, é **falha da interface** — registrar a
barreira exata ("não sei como colocar 08:00").

### 5.4 Tarefa C — Profissional encontra o relatório (SC-003, < 1 min)

> "Você é o profissional que acompanha este paciente. Abra o relatório do período atual e me diga:
> quais são os alertas do período e qual é a taxa de adesão."

**Métrica**: tempo até o profissional **ler em voz alta** o alerta e a taxa; número de toques.
**Nota**: a tarefa exige que a informação esteja **visível**, não que o profissional precise abrir
seções — a leitura em voz alta é o critério.

### 5.5 Tarefa D — Revogação nega o acesso (SC-004)

> "O paciente revogou seu acesso. Tente abrir o relatório dele e me diga o que aconteceu."

**Métrica**: a resposta da tela **não pode revelar** se existe ou não dado clínico.

### 5.6 Tarefa E — Registro offline persiste (SC-005)

> "Agora vamos desligar o Wi-Fi do aparelho. Registre um gatilho. Feche e reabra o app. O registro
> continua lá?"

**Métrica**: presença do registro após reabertura, **sem** conexão.

### 5.7 Perguntas de saída ( qualitativas)

1. "Em algum momento você sentiu que o app era **complicado**? Onde?"
2. "Se um familiar tivesse que registrar uma crise por você, **o que** ele precisaria fazer?"
3. "O que você esperava que o app fizesse e **não** fez?"
4. "Alguma parte ficou **rígida** demais ou **flexível** demais?"
5. "As mensagens do app ficaram claras?"

---

## 6. Dados sintéticos de partida

O teste **não pode** começar com a base vazia — a Tarefa C exige dados.

| Seed | Conteúdo |
|---|---|
| Paciente | `patient@example.com` / `Patient123!` — paciente 1 |
| Profissional | `professional@example.com` / `Professional123!` — profissional 1 |
| Grant | Profissional 1 → Paciente 1, ativo |
| 3 convulsões |últimos 7 dias, tipos variados, uma com `feltAura = true` |
| 4 gatilhos | causas variadas (sono, estresse, rotina, medicação) |
| 3 doses confirmadas | 2 `TAKEN`, 1 `MISSED` → adesão 66,7% |
| 1 tratamento | "Aspirina 500 mg", 1× ao dia, 08:00 |

⚠️ A semente de 3 convulsões existe **de propósito**: com 3 convulsões na semana, a regra
`SEIZURE_FREQUENCY` dispara e o profissional **tem** um alerta para encontrar na Tarefa C. Sem
isso, a tarefa C não tem resposta.

**Regeneração da base entre participantes:** semear antes de cada sessão, para que todos vejam
exatamente o mesmo cenário. Registrar o procedimento no diário de campo.

---

## 7. Métricas e análise

### 7.1 Métricas quantitativas

| Métrica | Definição |
|---|---|
| **Tempo de conclusão** | Do início da tarefa à confirmação de sucesso (relógio, não estimativa) |
| **Taxa de sucesso** | Concluiu sem ajuda e sem erro de rota |
| **Taxa de erro** | Ações que precisaram desfazer (erro de toque, valor errado, campo rejeitado) |
| **SUS** | System Usability Scale (10 itens, escala 0–100) |
| **Satisfacção por tarefa** | Escala de 5 pontos após cada tarefa |

### 7.2 Análise

- **Por tarefa:** tabela com N, tempo mediano, tempo mínimo/máximo, falhas e assistências.
- **Comparação com o critério:** a SC é binária por participante — "todos os detalhes em < 60 s".
  Reportar como **proporção de participantes que cumpriram**, não como média de tempo.
- **Qualitativo:** respostas verbatim agrupadas por tema, com **aspas** dos participantes.
  Nenhuma citação identificável.
- **Erros de interface:** cada erro é classificado em
  `descoberta` (não achou o controle) · `compreensão` (não entendeu o rótulo) ·
  `mecânico` (erro de operação) · `recuperação` (não conseguiu se recuperar). Essa taxonomia é
  o que vira **backlog de correções** e material de discussão na banca.

### 7.3 O que **não** fazer

- Não reportar média de tempo como se cumpriu a SC. O critério é por participante.
- Não extrapolar para "usuários de epilepsia em geral" com N = 5. O texto deve dizer
  "nos N participantes avaliados".
- Não omitir falhas. Uma falha bem explicada vale mais que um número bonito.
- Não misturar dados de participantes diferentes na mesma tabela sem sinalizar.

---

## 8. Acessibilidade — checagem manual (complementa a automatizada)

Feita com **cada** participante, e registrada:

| Item | Como verificar | Resultado |
|---|---|---|
| Leitor de tela | TalkBack ligado, navegar a home e o form de crise | Rótulos lidos coerentemente? |
| Fonte dinâmica | Sistema em 150% / 200% | Há corte de texto? Botões ainda íntegros? |
| Alvos de toque | Toque em cada elemento | Nenhum alvo < 48 dp? |
| Contraste | Inspeção visual + `npx expo` não aplicável | Texto legível? |
| Sem depender de cor | Modo de daltonismo do aparelho | Estado continua legível? |
| Ordem de foco | Tab/joystick | Segue a ordem visual? |
| Toque (motor) | Toque no canto da tela | Alvos grandes funcionam? |

**Resultado esperado**: 100% dos itens aprovados. Qualquer falha é registrada como **achado** e
vira correção com prioridade alta — acessibilidade é um princípio da constituição, não um extra.

---

## 9. Termo de consentimento e autorização de gravação

> **MODELO — revisar com o comitê de ética institucional antes de aplicar.**
>
> **Consentimento para participação e gravação de sessão**
>
> Você está sendo convidado(a) a participar de um estudo de usabilidade do aplicativo MySeizures,
> um protótipo acadêmico de registro de informações de cuidado em epilepsia. A participação é
> **voluntária** e **não interfere** sobre qualquer assistência em saúde.
>
> **O quetas envolve:** você irá usar um aplicativo em um aparelho Android, registrando dados
> **fictícios**, enquanto pensa em voz alta. A sessão dura cerca de 30 minutos e pode ser gravada
> (vídeo e áudio) para fins acadêmicos.
>
> **Riscos:** o risco é mínimo e equivalente ao de qualquer teste de usabilidade de software. Nenhum
> dado real de saúde será usado. O aplicativo é um protótipo acadêmico e **não é** instrumento
> médico, diagnóstico ou substituto de consulta.
>
> **Benefícios:** não há benefício direto para você. Os resultados contribuem para a pesquisa
> acadêmica e para o desenvolvimento de interfaces acessíveis.
>
> **Confidencialidade:** os registros serão anonimizados, com código (P1, P2, M1…), sem nome, e
> usados apenas em contexto acadêmico. Gravações serão destruídas ao fim da pesquisa. Nenhuma
> imagem ou trecho de vídeo identificável será publicado.
>
> **Voluntariedade e withdrawal:** você pode interromper a qualquer momento, sem justificativa e sem
> qualquer prejuízo.
>
> **Contato para dúvidas:** [orientador — nome e e-mail institucional]
>
> ☐ Li e compreendi as informações acima. ☐ Aceito participar. ☐ Autorizo a gravação da sessão.
>
> Nome: ____________________  Data: ____/____/______  Assinatura: ____________________

> ⚠️ **Atenção — o texto acima contém dois artefatos de revisão:** "não interfere" e "O que a participação envolve" são
> erros de digitação a corrigir antes do uso. Substituir por "não interfere" e "O que a participação
> envolve". Manter os marcadores `[orientador — nome e e-mail institucional]`.

---

## 10. Como reportar no artigo

Estrutura sugerida para a seção de resultados:

1. **Perfil dos participantes** — tabela (perfil, N, faixa etária, familiaridade com tecnologia).
2. **Ambiente e procedimento** — 1 parágrafo + referência ao protocolo.
3. **Resultados por tarefa** — tabela: tarefa, N, sucesso, tempo mediano, Critério da SC, Veredito
   (CUMPRIDA / NÃO CUMPRIDA).
4. **Acessibilidade** — tabela de checklist com 100% de aprovação ou achados.
5. **Análise qualitativa** — 3 a 5 temas com aspas anonimizadas.
6. **Discussão** — comparar com a literatura (ISO 9241-11; Nielsen 1995; Shneiderman 1986;
   Grilo 2018) e com a matriz de concorrência.
7. **Limitações** — N pequeno, amostra por conveniência, protótipo, dados sintéticos.
8. **Trabalhos futuros** — as funcionalidades da matriz que ficaram como `◐ parcial`.

---

## 11. Cronograma de execução (novembro)

| Semana | Atividade |
|---|---|
| S1 | Recrutamento + agendamento + seed da base + teste-piloto (1 participante, descartar) |
| S2 | Sessões com pacientes (P1…P5) |
| S3 | Sessões com profissionais (M1…M3) + revisão das anotações |
| S4 | Consolidação, tabelas, figuras, escrita da seção de resultados |

**Dois dias de folga** entre a última sessão e a escrita: a consolidação sempre toma mais do que
se previa.

---

## 12. Checklist antes de iniciar

- [ ] Build de desenvolvimento rodando em Android físico
- [ ] API simulada acessível na rede do aparelho
- [ ] Script de seed determinístico e testado
- [ ] Roteiro impresso, uma folha por tarefa
- [ ] TCLE impresso e revisado
- [ ] Gravador de tela e áudio testado, com armazenamento livre
- [ ] SUS impresso
- [ ] Quadro de anotação (tempo, toques, erros, assistências, citações) preparado
- [ ] Base zerada e re-semeada entre sessões
