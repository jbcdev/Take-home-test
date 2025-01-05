import { includes } from "./utils";

export class Drug {
  /**
   * @param {string} name
   * @param {number} expiresIn
   * @param {number} benefit
   */
  constructor(name, expiresIn, benefit) {
    this.name = name;
    this.expiresIn = expiresIn;
    this.benefit = benefit;
  }
}

export class BenefitUpdateRule {
  /**
   * @param {number} validFrom
   * @param {number} validUntil
   * @param {() => number} valueUpdater
   */
  constructor(valueUpdater, validFrom = null, validUntil = null) {
    this.valueUpdater = valueUpdater;
    this.validFrom = validFrom;
    this.validUntil = validUntil;
  }
}

class OverlappingRulesError extends Error {}
class NoSuitableBenefitUpdateRuleError extends Error {}

export class DrugBenefitUpdater {
  /**
   * @param {BenefitUpdateRule[]} benefitUpdateRules
   */
  constructor(benefitUpdateRules = []) {
    this.benefitUpdateRules = benefitUpdateRules;
    this.checkRules();
  }

  checkRules() {
    const rules = [...this.benefitUpdateRules];
    while (rules.length) {
      const rule = rules.shift();
      if (
        rules.some(
          (r) =>
            (rule.validFrom !== null && includes(r, rule.validFrom, true)) ||
            (rule.validFrom !== null && includes(r, rule.validUntil, true)),
        )
      ) {
        throw new OverlappingRulesError();
      }
    }
  }

  /**
   * @param {number} expiresIn
   */
  getCurrentRule(expiresIn) {
    if (this.benefitUpdateRules.length === 0) {
      return null;
    }
    const currentRule = this.benefitUpdateRules.find((r) =>
      includes(r, expiresIn),
    );
    if (currentRule) {
      return currentRule;
    }
    const defaultRule = this.benefitUpdateRules.find(
      (r) => r.validFrom === null && r.validUntil === null,
    );
    if (defaultRule) {
      return defaultRule;
    }
    throw new NoSuitableBenefitUpdateRuleError(
      `No suitable update rule for expiresIn ${expiresIn}: ${JSON.stringify(this.benefitUpdateRules)}`,
    );
  }

  /**
   * @param {Drug} drug
   */
  updateBenefit(drug) {
    const rule = this.getCurrentRule(drug.expiresIn);
    if (!rule) return drug;
    drug.benefit = Math.max(Math.min(rule.valueUpdater(drug.benefit), 50), 0);
    drug.expiresIn -= 1;
    return drug;
  }
}

export class Pharmacy {
  /**
   * @param {Drug[]} drugs
   * @param {DrugBenefitUpdater[]} benefitUpdaters
   */
  constructor(drugs = []) {
    this.drugs = drugs;
    this.benefitUpdaters = {
      default: new DrugBenefitUpdater([
        new BenefitUpdateRule((b) => b - 1, null, 1),
        new BenefitUpdateRule((b) => b - 2, 0),
      ]),
      "Herbal Tea": new DrugBenefitUpdater([
        new BenefitUpdateRule((b) => b + 1, null, 1),
        new BenefitUpdateRule((b) => b + 2, 0),
      ]),
      Fervex: new DrugBenefitUpdater([
        new BenefitUpdateRule((b) => b + 1),
        new BenefitUpdateRule((b) => b + 2, 10, 6),
        new BenefitUpdateRule((b) => b + 3, 5, 1),
        new BenefitUpdateRule(() => 0, 0),
      ]),
      "Magic Pill": new DrugBenefitUpdater(),
      Dafalgan: new DrugBenefitUpdater([
        new BenefitUpdateRule((b) => b - 2, null, 1),
        new BenefitUpdateRule((b) => b - 4, 0),
      ]),
    };
  }

  updateBenefitValue() {
    for (var i = 0; i < this.drugs.length; i++) {
      const benefitValueUpdater =
        this.drugs[i].name in this.benefitUpdaters
          ? this.benefitUpdaters[this.drugs[i].name]
          : this.benefitUpdaters.default;

      this.drugs[i] = benefitValueUpdater.updateBenefit(this.drugs[i]);
    }

    return this.drugs;
  }
}
