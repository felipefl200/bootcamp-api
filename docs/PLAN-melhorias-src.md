# PLAN — Melhorias no `src/`

> Análise completa do código fonte com oportunidades de melhoria priorizadas por impacto.

---

## 🔴 P0 — Bugs / Erros de compilação

### 1. `ai.ts` — Use cases instanciados sem dependências

Os use cases na rota AI são criados sem passar os repositórios obrigatórios ao construtor:

```typescript
// ❌ Erro: Expected 1 arguments, but got 0
const uc = new GetUserTrainData() // L83
const uc = new UpsertUserTrainData() // L97
const uc = new ListWorkoutPlans() // L105
const uc = new CreateWorkoutPlan() // L141
```

**Correção:** Usar as factories existentes (`makeGetUserTrainDataController`, etc.) ou instanciar com os repositórios Prisma diretamente.

---

### 2. `estimatedDurationInSeconds` hardcoded como `0`

- [GetWorkoutPlan.ts:L56](file:///home/felipe/bootcamp/api/src/usecases/GetWorkoutPlan.ts#L56) — Retorna `0` fixo com código morto de cálculo acima (L41-47).
- [GetHomeData.ts:L82](file:///home/felipe/bootcamp/api/src/usecases/GetHomeData.ts#L82) — Retorna `0` fixo.

**Causa raiz:** O repositório `findByIdWithDays` só seleciona `{ id: true }` dos exercícios — insuficiente para calcular duração. Dois caminhos:

- **a)** Alterar o select do Prisma para incluir `set`, `rep`, `restTime`
- **b)** Criar um novo método `findByIdWithDaysAndExercises` que retorna os dados completos

---

### 3. Parâmetros com `implicit any` nos use cases

O `tsc` reporta 9 erros de `TS7006` em:

- `CreateWorkoutPlan.ts` (L67, L72) — parâmetros `day`, `exercise`
- `GetHomeData.ts` (L73) — `day`
- `GetWorkoutDay.ts` (L65 x2, L72, L82) — `total`, `exercise`, `session`
- `GetWorkoutPlan.ts` (L40, L42 x2) — `day`, `total`, `exercise`
- `UpdateWorkoutSession.ts` (L47) — `day`

**Correção:** Tipar os parâmetros dos callbacks `.map()` e `.reduce()`.

---

## 🟡 P1 — Arquitetura / Design

### 4. Controllers não implementam `IController`

Existe [IController.ts](file:///home/felipe/bootcamp/api/src/controllers/IController.ts) definindo a interface padrão, mas nenhum controller implementa `implements IController`. A interface é código morto.

**Ação:** Cada controller deve `implements IController`.

---

### 5. Factories criam novas instâncias a cada request

Cada chamada de factory instancia novos repositórios. Para stateless repositories (como os Prisma), isso é desperdício.

```typescript
// Cada request cria new PrismaWorkoutPlanRepository()
export const makeCreateWorkoutPlanController = () => {
  const workoutPlanRepository = new PrismaWorkoutPlanRepository()
  ...
```

**Opções:**

- **a)** Singleton por repositório (cache de instâncias)
- **b)** Container de DI leve (ex: `tsyringe` ou manual)

---

### 6. Lógica de Streak duplicada (DRY violation)

O cálculo de `workoutStreak` é **copy-paste idêntico** em:

- [GetHomeData.ts:L108-132](file:///home/felipe/bootcamp/api/src/usecases/GetHomeData.ts#L108-L132)
- [GetStats.ts:L93-113](file:///home/felipe/bootcamp/api/src/usecases/GetStats.ts#L93-L113)

**Ação:** Extrair para um helper/service compartilhado:

```
src/helpers/calculateWorkoutStreak.ts
```

---

### 7. Error handling repetitivo nos controllers

Todos os controllers repetem o mesmo padrão de `try/catch` com auth check + error mapping. São ~15-25 linhas idênticas.

**Ação:** Extrair para um middleware Fastify ou um `BaseController`:

- Middleware de autenticação que injeta `userId` no request
- Handler de erro global que mapeia exceções para HTTP status codes

---

### 8. Rota `/ai` — Prompt do sistema hardcoded e sem Clean Architecture

A [rota `ai.ts`](file:///home/felipe/bootcamp/api/src/routes/ai.ts) tem 72 linhas de system prompt inline, lógica de negócio misturada com definição de rota, e instanciação manual de use cases.

**Ação:**

- Extrair prompt para `src/prompts/personal-trainer.ts`
- Criar um `AiChatController` seguindo o padrão existente
- Usar factories para instanciar use cases nas tools

---

## 🟢 P2 — Qualidade / DX

### 9. Sem validação de variáveis de ambiente

`DATABASE_URL`, `PORT`, `NODE_ENV`, `OPENAI_API_KEY` são usados sem validação. Se `DATABASE_URL` estiver ausente, o erro é críptico.

**Ação:** Criar `src/lib/env.ts` com Zod:

```typescript
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  OPENAI_API_KEY: z.string().min(1)
})
export const env = envSchema.parse(process.env)
```

---

### 10. CORS origins hardcoded

Em [fastify-app.ts:L44](file:///home/felipe/bootcamp/api/src/lib/fastify-app.ts#L44) e [auth.ts:L8](file:///home/felipe/bootcamp/api/src/lib/auth.ts#L8), as origens estão hardcoded.

**Ação:** Mover para `env.CORS_ORIGINS` (array de strings do `.env`).

---

### 11. Sem graceful shutdown

O [index.ts](file:///home/felipe/bootcamp/api/src/index.ts) não trata `SIGTERM`/`SIGINT`.

**Ação:**

```typescript
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await app.close()
    process.exit(0)
  })
}
```

---

### 12. Schema monolítico

[schemas/index.ts](file:///home/felipe/bootcamp/api/src/schemas/index.ts) (190 linhas) concentra todos os schemas Zod em um único arquivo.

**Ação:** Dividir por domínio:

```
src/schemas/
├── workout-plan.schema.ts
├── workout-session.schema.ts
├── dashboard.schema.ts
├── user.schema.ts
└── error.schema.ts
```

---

### 13. Código morto / Comentários legados

- `GetWorkoutPlan.ts:L41-47` — Cálculo de `reduce` que nunca executa (retorna `0` fixo na L56)
- `GetHomeData.ts:L79-82` — Comentários longos sobre workaround que deveria ser resolvido
- `GetStats.ts:L78-81` — Comentários sobre "gambiarra aceitável"

**Ação:** Remover código morto e resolver os workarounds ou documentar como tech debt.

---

### 14. Testes sem cobertura de controllers e routes

Os 64 testes cobrem apenas use cases e errors. Faltam:

- Testes de integração para routes (HTTP requests reais com Fastify `inject`)
- Testes de controllers garantindo error mapping correto

---

## Resumo de Priorização

| Prioridade | Item                              | Esforço | Impacto                |
| ---------- | --------------------------------- | ------- | ---------------------- |
| 🔴 P0      | #1 `ai.ts` use cases sem deps     | Baixo   | Bug em produção        |
| 🔴 P0      | #2 `estimatedDuration` = 0        | Médio   | Feature quebrada       |
| 🔴 P0      | #3 Implicit `any` nos use cases   | Baixo   | Type safety            |
| 🟡 P1      | #4 `IController` não implementado | Baixo   | Consistência           |
| 🟡 P1      | #5 Factories sem singleton        | Baixo   | Performance            |
| 🟡 P1      | #6 Streak duplicada (DRY)         | Baixo   | Manutenibilidade       |
| 🟡 P1      | #7 Error handling repetitivo      | Médio   | DRY / Manutenibilidade |
| 🟡 P1      | #8 `ai.ts` sem Clean Architecture | Médio   | Manutenibilidade       |
| 🟢 P2      | #9 Env validation                 | Baixo   | DX / Segurança         |
| 🟢 P2      | #10 CORS hardcoded                | Baixo   | Flexibilidade          |
| 🟢 P2      | #11 Graceful shutdown             | Baixo   | Resiliência            |
| 🟢 P2      | #12 Schema monolítico             | Baixo   | Organização            |
| 🟢 P2      | #13 Código morto                  | Baixo   | Limpeza                |
| 🟢 P2      | #14 Testes de integração          | Alto    | Confiabilidade         |

---

## Próximos Passos

```
[OK] Plan criado: docs/PLAN-melhorias-src.md

Next steps:
- Revise o plano
- Priorize os itens que deseja implementar
- Execute /enhance <item> para implementar cada melhoria
```
