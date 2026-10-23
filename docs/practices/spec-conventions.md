# Convenções de Especificação — MySeizures

> Formato dos artefatos de requisito, critérios de aceitação, fluxos e prompts de implementação.
> Derivado de `docs/instructions/Expert de Desenvolvimento.pdf` e das specs já existentes em
> `specs/001-manage-epilepsy-care/`.
>
> **Status:** v1.0 · **Data:** 20/10/2026

---

## 1. Fluxo de trabalho

O "Expert de Desenvolvimento" define um pipeline de 5 passos. Este projeto **mantém o fluxo**, mas
ajusta o escopo de cada passo para a realidade de um protótipo acadêmico com prazo apertado.

| # | Passo | O que é | Adaptação neste projeto |
|---|---|---|---|
| 1 | **Análise** | Identificar domínio, escopo e complexidade. Se faltar informação crítica, **perguntar** (máx. 5 por vez) | Idem. Perguntas no máximo 5 por rodada, e sempre com a hipótese do agente junto |
| 2 | **Elicitação** | Perguntas estruturadas para preencher lacunas: usuários, integrações, volume, requisitos regulatórios, ambiente de deploy | Reduzido a **3 perguntas** no modo rápido dos 8Rs. Perguntar sozinho vira formulário |
| 3 | **Documentação** | Produzir os artefatos: visão geral → requisitos → UML → especificação técnica | Ordem mantida, com **entrega incremental** |
| 4 | **Validação** | Revisar: todos os requisitos têm critério de aceitação? o UML reflete os requisitos? cada requisito é verificável? a arquitetura é adequada ao escopo? | Idem, e acrescida de: **o requisito é verificável no teste de usabilidade?** |
| 5 | **Refinamento** | Aceitar feedback e ajustar, **mantendo versionamento** (v1, v2, v3) e indicando o que mudou | Idem. Cada artefato tem **tabela de revisões** no rodapé |

**Regra do passo 3:** *entregue incrementalmente — visão geral → requisitos → UML → especificação
técnica*. Nunca entrega o artefato final de uma vez.

---

## 2. Numeração e identificadores

| Prefixo | Significado | Exemplo |
|---|---|---|
| `FR-XXX` | Requisito **funcional** | `FR-014` |
| `RNF-XXX` | Requisito **não funcional** | `RNF-006` |
| `RN-XXX` | Regra de negócio | `RN-012` |
| `UC-XXX` | Caso de uso | `UC-005` |
| `SE-XXX` | Story de usuário | `SE-006` |
| `SC-XXX` | Critério de sucesso (mensurável) | `SC-006` |
| `TR-XXX` | Requisito de acessibilidade | `TR-004` |

**Regra:** numeração **sequencial e estável** dentro do feature. Um identificador **nunca** é
reutilizado para outro significado. Requisito removido vira `obsoleto` — a faixa fica reservada.

---

## 3. Requisito funcional (RF)

```markdown
| ID | Requisito | Prioridade | Critérios de aceitação | Regras |
|----|-----------|------------|------------------------|--------|
| FR-014 | O sistema deve permitir que o paciente registre uma crise com data, hora e tipo, com a data e hora preenchidas por padrão com o momento atual. | P1 | Given ... When ... Then ... | RN-003, RN-004 |
```

**Prioridade — MoSCoW**

| Nível | Significado |
|---|---|
| **Must** | Sem isso o feature não existe |
| **Should** | Muito importante, mas o feature funciona sem |
| **Could** | Desejável, cabe se houver folga |
| **Won't** | Fora de escopo **nesta iteração** (não "nunca") |

**Critério de aceitação** — formato **Given / When / Then**, um comportamento por critério:

```
Given que o paciente está autenticado
  And que a home está carregada
When ele toca em "Registrar crise"
Then o formulário abre com a data e hora igual ao momento atual
  And o campo de tipo está vazio
  And o botão de salvar está desabilitado
```

Regras de escrita:
- **Comportamento observável**, não implementação. "a data está preenchida", não "o estado inicial
  usa `new Date()`.
- **Sem implementação no requisito.** Se o RF menciona componente, tabela ou função, ele é
  específico demais.
- **Testável por automação ou por tarefa de usabilidade** — sempre um dos dois.
- **Negativo quando importa**: "Then a mensagem não revela se existe registro clínico".

---

## 4. Requisito não funcional (RNF)

```markdown
| ID | Categoria | Descrição | Justificativa | Verificação |
|----|-----------|-----------|---------------|-------------|
| RNF-006 | Usabilidade | 90% dos pacientes registram uma crise com todos os detalhes em menos de 60 segundos | É o critério de diferenciação da proposta e a métrica da SC-001 | Estudo de usabilidade, Tarefa A |
```

**Categorias:** Performance · Segurança · Usabilidade · Manutenibilidade · Escalabilidade ·
Compatibilidade.

**Regra:** descrição **métrica ou condicional mensurável**. "O sistema deve ser rápido" não é RNF.
"Um registro de crise é persistido em menos de 500 ms no dispositivo de referência" é.

---

## 5. Regras de negócio (RN)

```markdown
RN-012: Uma confirmação final de dose não pode ser substituída por uma confirmação de
         status diferente. Tentativas conflitantes devem falhar com erro explícito.
```

**Regra de escrita:** uma regra = um comportamento verificável, no **presente**, sem
"deve-se", "preferencialmente" ou "quando possível". Cada RN que envolva limiar **tem teste de
fronteira** (o valor exato, um abaixo e um acima).

---

## 6. Modelagem — PlantUML

Diagramas em **PlantUML**, em bloco ```` ```plantuml ````, prontos para renderização.

| Diagrama | Quando usar | O que **deve** conter |
|---|---|---|
| **Casos de uso** | escopo do feature | Atores primários e secundários, pré-condições, fluxo principal, fluxos alternativos e de exceção, pós-condições, `include`/`extend`/`generalization` |
| **Classes** | modelo de domínio | Atributos com tipo e visibilidade, métodos, relacionamentos com multiplicidade, estereótipos (`Entity`, `Service`, `Repository`, `Controller`) |
| **Sequência** | fluxo crítico | Lifelines de atores e objetos, mensagens síncronas e assíncronas, blocos `alt`/`opt`/`loop`, notas com regra de negócio |
| **Atividades** | fluxo de negócio complexo | Raias (swimlanes) por ator/sistema, decisões, bifurcações e junções, início e fim |
| **Estados** | entidade com ciclo de vida complexo | Estados, transições, guardas e ações |

**Regra:** *não gerar diagrama sem descrição textual complementar*. O diagrama é índice; o texto
é a especificação.

**Sobre o código:** o repositório **não** gera PlantUML no build. Os diagramas vivem em
`docs/architecture.md` e nos ADRs, e são **verificados por leitura** contra o código.

---

## 7. Especificação técnica

Por módulo ou funcionalidade:

```markdown
### 3.1 Descrição técnica detalhada
- Arquitetura recomendada e justificativa
- Stack tecnológica sugerida e justificativa
- Estrutura de pastas/módulos esperada
- Padrões de design a aplicar

### 3.2 Especificação de API/Endpoints
Por endpoint: método e rota · parâmetros (path, query, body) com tipo e validação ·
headers necessários · corpo de requisição (schema JSON) · corpo de resposta (200, 4xx, 5xx) ·
regras de negócio executadas · efeitos colaterais

### 3.3 Modelo de dados
Entidades com campos, tipos, constraints (PK, FK, unique, not null, default) · relacionamentos
com cardinalidade · índices · migrations e versionamento de schema

### 3.4 Lógica de negócio em pseudocódigo
Algoritmos críticos · validações e transformações · tratamento de erros e exceções ·
fluxos condicionais e loops com critérios de saída claros
```

**No MySeizures**, o mapeamento para o código é:

| Seção da spec técnica | Onde vira código |
|---|---|
| 3.1 | `docs/architecture.md` + estrutura de `mobile/src/` |
| 3.2 | `specs/.../contracts/rest-api.md` + `api/src/routes/` |
| 3.3 | `mobile/src/infrastructure/persistence/migrations/` + `specs/.../data-model.md` |
| 3.4 | `mobile/src/domain/rules/` |

---

## 8. Prompt de geração de código (por módulo)

Quando a implementação de um módulo for delegada a um agente de código, o prompt segue esta
estrutura — **a mesma** que produziu o `prompts/` deste repositório:

```
MÓDULO      <nome e caminho>
CONTEXTO    <sistema, arquitetura e o que já existe>
ENTIDADES   <entidades e relacionamentos>
ENDPOINTS   <rotas com schemas>
REGRAS      <regras de negócio numeradas>
VALIDAÇÕES  <validações obrigatórias>
ERROS       <estratégia de tratamento de erro>
DEPENDÊNCIAS <bibliotecas e módulos necessários>
PADRÕES     <padrões de código e arquitetura a seguir>
TESTES      <casos de teste a implementar>
IGNORAR     <o que NÃO fazer>
```

**A seção `IGNORAR` é obrigatória.** Ela é o que impede o agente de mexer em código fora do
escopo — foi exatamente o que faltou nos prompts anteriores deste projeto (ver
`prompts/fix-development-build.md`, que registra o incidente do *root-level 'expo' object*).

---

## 9. Traitamento de ambiguidade, contradição e suposição

| Situação | Como tratar |
|---|---|
| Solicitação vaga | **Não assumir.** Perguntar (máx. 5 por vez) |
| Múltiplas interpretações válidas | Apresentar as **opções** e pedir a escolha |
| Contradição entre requisitos | **Sinalizar explicitamente** antes de continuar |
| Informação faltando e não inferível | Marcar como `SUPOSIÇÃO` e pedir confirmação |

**Sobre suposições:** marcar `SUPOSIÇÃO` não é fraqueza — é o que permite avançar sem bloquear.
Uma suposição **não marcada** é um erro silencioso.

**Sobre contradições:** o *Expert de Desenvolvimento* é explícito: *"Se detectar contradição entre
requisitos, sinalize explicitamente antes de continuar"*. No MySeizures, o exemplo canônico é a
**matriz de concorrência × o código** — a matriz afirma 13/13 e o código entrega 8. Essa
contradição foi resolvida por decisão documentada (ADR 0003 + matriz em dois níveis), não por
silêncio.

---

## 10. O que **não** fazer

- **Não produzir código de implementação final** no artefato de especificação. A spec descreve;
  quem implementa é o agente de código, que recebe o prompt da §8.
- **Não pular a elicitação** quando houver lacunas importantes. O modo rápido dos 8Rs já é a
versão de elicitação de uma camada: extrair tudo o que já está no texto e perguntar no máximo 2 coisas.
- **Não usar linguagem ambígua** ("talvez", "pode ser", "se possível"). "Pode ser" é
  "não decidido" — e não decidido precisa virar `SUPOSIÇÃO` ou pergunta.
- **Não omitir critérios de aceitação** dos requisitos funcionais. Requisito sem critério é um desejo sem forma.
- **Não gerar diagrama UML sem descrição textual complementar.**
- **Não reescrever o que já está decidido** (ADRs aceitos) — a spec referencia o ADR.

---

## 11. Checklist de um artefato de spec

- [ ] Cada RF tem **ID estável**, prioridade MoSCoW e ao menos um critério GWT
- [ ] Cada RNF tem **métrica** e **método de verificação**
- [ ] Cada RN é **verificável** e, se tiver limiar, tem **teste de fronteira**
- [ ] Cada SC é **mensurável** e diz **como** será medido
- [ ] Diagramas PlantUML presentes onde há fluxo ou modelo, **com** texto complementar
- [ ] Contrato de dados referenciado (API, export, migrations) com **versão**
- [ ] Suposições marcadas como `SUPOSIÇÃO`
- [ ] Contradições sinalizadas, não silenciadas
- [ ] Decisões estruturais referenciadas a ADR, não re-decididas aqui
- [ ] Tabela de revisões no rodapé com o que mudou entre versões
