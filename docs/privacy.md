# Privacy & Ethics Policy

## Overview

KenPoliMarket is committed to protecting individual privacy while providing valuable political forecasting insights. This document outlines our privacy-first approach and compliance with Kenyan law.

## Legal Compliance

### Kenya Data Protection Act 2019

We fully comply with the Kenya Data Protection Act 2019:

- ✅ **Lawful basis for processing**: Public interest and research purposes
- ✅ **Data minimization**: Only collect necessary aggregate data
- ✅ **Purpose limitation**: Data used only for forecasting and research
- ✅ **Accuracy**: Data sourced from official IEBC and KNBS sources
- ✅ **Storage limitation**: Raw data retained only as long as necessary
- ✅ **Integrity and confidentiality**: Secure storage and transmission
- ✅ **Accountability**: Full documentation and audit trails

## Privacy Principles

### 1. No Individual-Level Data

**We do NOT:**
- Process individual voter data
- Infer ethnicity from names or other personal identifiers
- Store personally identifiable information (PII)
- Track individual voting behavior

**We DO:**
- Use only aggregate county-level statistics
- Process official IEBC election results (public data)
- Use KNBS census aggregates (county-level ethnicity distributions)

### 2. Minimum Aggregate Size

All ethnicity-related data enforces a **minimum aggregate size of 10 individuals**.

- Any group with fewer than 10 individuals is suppressed
- This prevents re-identification of individuals
- Applies to all outputs: forecasts, APIs, visualizations

### 3. Aggregate-Only Ethnicity Data

**Source**: KNBS 2019 Census Volume IV (official aggregate statistics)

**What we use:**
- County-level ethnicity distributions (e.g., "Kisii County: 85% Kisii, 10% Luhya, 5% Other")
- Sub-county aggregates where available and above minimum threshold

**What we DON'T use:**
- Individual-level ethnicity data
- Name-to-ethnicity inference
- Polling station-level ethnicity (too granular)

### 4. Transparent Methodology

All models and data sources are documented:
- Model code is open source
- Data sources are cited
- Assumptions are explicit
- Uncertainty is quantified

## Data Sources

### Official & Public Data

1. **IEBC Election Results**
   - Source: https://www.iebc.or.ke
   - Type: Public official results
   - Level: County, constituency, polling station
   - Privacy: No PII, aggregate vote counts only

2. **KNBS Census Data**
   - Source: https://www.knbs.or.ke
   - Type: Official census aggregates
   - Level: County, sub-county (where above threshold)
   - Privacy: Aggregate statistics only, no individual records

3. **Survey Data (Consented)**
   - Source: Platform surveys
   - Type: Voluntary, consented responses
   - Level: Aggregate only
   - Privacy: Minimum 5 responses per aggregate, no PII stored

## Gambling & Prediction Markets

### Legal Compliance

**We do NOT operate real-money gambling or betting.**

- ❌ No real-money prediction markets
- ❌ No cash payouts on election outcomes
- ❌ No licensed gambling operations

**We DO offer:**
- ✅ Play-money prediction markets (virtual currency only)
- ✅ Reputation-based systems
- ✅ Educational forecasting tools

### Rationale

Kenya's gambling regulations require licensing for real-money betting on elections. To avoid legal risk and focus on research/education, we use only play-money mechanisms.

## User Rights (GDPR-Aligned)

Users have the right to:

1. **Access**: Request access to any personal data we hold
2. **Rectification**: Correct inaccurate personal data
3. **Erasure**: Request deletion of personal data
4. **Portability**: Export personal data in machine-readable format
5. **Objection**: Object to processing of personal data
6. **Withdraw consent**: Withdraw consent for survey participation

**Note**: Most platform features use only aggregate public data, so personal data is minimal.

## Data Retention

| Data Type | Retention Period | Rationale |
|-----------|------------------|-----------|
| IEBC results | Indefinite | Public historical record |
| KNBS census | Indefinite | Public statistical record |
| Survey responses (aggregate) | 5 years | Research purposes |
| Survey responses (individual) | Deleted after aggregation | Privacy protection |
| User accounts | Until deletion request | User management |
| API logs | 90 days | Security and debugging |

## Security Measures

- 🔒 **Encryption**: TLS 1.3 for data in transit
- 🔒 **Access control**: Role-based access to sensitive data
- 🔒 **Audit logs**: All data access logged
- 🔒 **Regular audits**: Quarterly privacy audits
- 🔒 **Incident response**: 72-hour breach notification

## Ethical Considerations

### 1. Avoiding Harm

- Forecasts are probabilistic, not deterministic
- Uncertainty is always communicated
- No forecasts are presented as "certain"
- Historical accuracy is tracked and published

### 2. Fairness & Bias

- Models are tested for demographic bias
- Feature importance is documented
- Ethnicity is used only as aggregate demographic context, not as a deterministic predictor
- Regular bias audits

### 3. Transparency

- Model code is open source
- Data sources are cited
- Assumptions are documented
- Limitations are acknowledged

### 4. Accountability

- Contact information provided
- Complaints process established
- Regular external audits
- Public accuracy tracking

## Contact & Complaints

**Data Protection Officer**
- Email: privacy@kenpolimarket.com
- Phone: +254 XXX XXX XXX

**Office of the Data Protection Commissioner (Kenya)**
- Website: https://www.odpc.go.ke
- Email: info@odpc.go.ke

## Updates to This Policy

This policy may be updated to reflect:
- Changes in Kenyan law
- New data sources
- Platform features
- User feedback

**Last Updated**: 2025-10-03

---

**Summary**: We prioritize privacy, use only aggregate data, comply with Kenyan law, and operate no real-money gambling. All ethnicity data is county-level aggregates with minimum thresholds. Transparency and accountability are core principles.

