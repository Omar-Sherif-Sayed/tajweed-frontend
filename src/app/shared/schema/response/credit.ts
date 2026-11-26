/** The credit a source asks for (`DtoCredit`): shown on every screen that shows its content. */
export interface DtoCredit {
  /** The name to show. */
  readonly name: string;
  /** Its link. */
  readonly url: string;
  /** Under which terms it is used. */
  readonly terms: string;
}
