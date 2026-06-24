# ReviewForge — Product Roadmap

Planned enhancements for the next development phase.

---

## فارسی

اگر بخواهم ادامه بدهم، **rule engine را configurable می‌کنم**، **RBAC اضافه می‌کنم**، و **embedding را به OpenAI یا مدل داخلی سازمان وصل می‌کنم**.

### جزئیات

| اولویت | قابلیت | توضیح |
|--------|--------|--------|
| 1 | **Configurable Rule Engine** | قوانین AutoReview (`GEO-001`…`GEO-004`) از طریق config یا admin UI قابل تنظیم — آستانه thin-wall، severity، و ruleهای سازمانی (`STD-*`) |
| 2 | **RBAC** | نقش‌های Reviewer، SME، Admin — دسترسی به design، comment، و lesson management |
| 3 | **Enterprise Embeddings** | جایگزینی embedding دمو با OpenAI `text-embedding-3` یا مدل داخلی سازمان برای semantic search دقیق‌تر |

---

## English

Next phase priorities:

1. **Configurable rule engine** — Make AutoReview geometry rules (`GEO-001`…`GEO-004`) tunable via config or admin UI; support org-specific standards (`STD-*`).
2. **RBAC** — Role-based access for Reviewer, SME, and Admin personas.
3. **Enterprise embeddings** — Connect semantic search to OpenAI or an on-prem embedding model instead of the demo hash-based embedder.

---

## Out of scope (current MVP)

- Multi-tenant isolation
- PLM/CAD native integrations
- Real-time collaborative cursors

See [README](../README.md) for current capabilities.
