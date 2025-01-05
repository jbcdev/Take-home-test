import {
  Drug,
  Pharmacy,
  DrugBenefitUpdater,
  BenefitUpdateRule,
  OverlappingRulesError,
  NoSuitableBenefitUpdateRuleError,
} from "./pharmacy";

describe("Pharmacy", () => {
  it("should decrease the benefit and expiresIn", () => {
    expect(new Pharmacy([new Drug("test", 2, 3)]).updateBenefitValue()).toEqual(
      [new Drug("test", 1, 2)],
    );
  });
  it("should handle Dafalgan before expiry", () => {
    expect(
      new Pharmacy([new Drug("Dafalgan", 2, 10)]).updateBenefitValue(),
    ).toEqual([new Drug("Dafalgan", 1, 8)]);
  });
  it("should handle Dafalgan after expiry", () => {
    expect(
      new Pharmacy([new Drug("Dafalgan", -1, 10)]).updateBenefitValue(),
    ).toEqual([new Drug("Dafalgan", -2, 6)]);
  });
});

describe("DrugBenefitUpdater", () => {
  describe("checkRules", () => {
    it("should succeed for a valid set of rules", () => {
      const updater = new DrugBenefitUpdater([
        new BenefitUpdateRule(() => 0, 300, 201),
        new BenefitUpdateRule(() => 0, 200, 101),
        new BenefitUpdateRule(() => 0, 100, 50),
      ]);
      expect(updater).toBeInstanceOf(DrugBenefitUpdater);
    });
    it("should fail for a rule duplicate", () => {
      expect(() => {
        new DrugBenefitUpdater([
          new BenefitUpdateRule(() => 0, 300, 201),
          new BenefitUpdateRule(() => 0, 300, 201),
        ]);
      }).toThrow(OverlappingRulesError);
    });
    it("should fail for a rule overlap", () => {
      expect(() => {
        new DrugBenefitUpdater([
          new BenefitUpdateRule(() => 0, 300, 201),
          new BenefitUpdateRule(() => 0, 250, 151),
        ]);
      }).toThrow(OverlappingRulesError);
    });
  });
  describe("getCurrentRule", () => {
    it("should return null for empty rule set", () => {
      const updater = new DrugBenefitUpdater();
      expect(updater.getCurrentRule(1)).toEqual(null);
    });
    it("should return a matching rule for expires in contained into the rule interval", () => {
      const updater = new DrugBenefitUpdater([
        new BenefitUpdateRule(() => 0, 100, 50),
      ]);

      const res = updater.getCurrentRule(75);
      expect(res).toEqual(updater.benefitUpdateRules[0]);
    });
    it("should return a matching rule for expires in contained equal to interval start", () => {
      const updater = new DrugBenefitUpdater([
        new BenefitUpdateRule(() => 0, 100, 50),
      ]);

      const res = updater.getCurrentRule(100);
      expect(res).toEqual(updater.benefitUpdateRules[0]);
    });
    it("should return a matching rule for expires in contained equal to interval end", () => {
      const updater = new DrugBenefitUpdater([
        new BenefitUpdateRule(() => 0, 100, 50),
      ]);

      const res = updater.getCurrentRule(50);
      expect(res).toEqual(updater.benefitUpdateRules[0]);
    });
    it("should return a matching rule from a set of rule", () => {
      const updater = new DrugBenefitUpdater([
        new BenefitUpdateRule(() => 0, 300, 201),
        new BenefitUpdateRule(() => 0, 200, 101),
        new BenefitUpdateRule(() => 0, 100, 50),
      ]);

      const res = updater.getCurrentRule(75);
      expect(res).toEqual(updater.benefitUpdateRules[2]);
    });
    it("should return default rule if no rules matches", () => {
      const updater = new DrugBenefitUpdater([
        new BenefitUpdateRule(() => 0, 100, 50),
        new BenefitUpdateRule(() => 0, 49, 0),
        new BenefitUpdateRule(() => 0),
      ]);

      const res = updater.getCurrentRule(-2);
      expect(res).toEqual(updater.benefitUpdateRules[2]);
    });
    it("should throw NoSuitableBenefitUpdateRule if no rule matched", () => {
      const updater = new DrugBenefitUpdater([
        new BenefitUpdateRule(() => 0, 100, 50),
      ]);

      expect(() => {
        updater.getCurrentRule(0);
      }).toThrow(NoSuitableBenefitUpdateRuleError);
    });
  });
});
