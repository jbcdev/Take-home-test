/**
 * @param {BenefitUpdateRule} rule
 * @param {number} value
 * @param {boolean} strict
 */
export function includes(rule, value, strict = false) {
  let fromCond = rule.validFrom >= value;
  let untilCond = rule.validUntil <= value;

  if (strict) {
    return (
      rule.validFrom !== null &&
      rule.validUntil !== null &&
      fromCond &&
      untilCond
    );
  }

  fromCond = fromCond || rule.validFrom === null;
  untilCond = untilCond || rule.validUntil === null;

  return (
    !(rule.validFrom === null && rule.validUntil === null) &&
    fromCond &&
    untilCond
  );
}
