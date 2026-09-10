export class LatestOperationGate {
  private generation = 0;

  begin(): number {
    this.generation += 1;
    return this.generation;
  }

  isCurrent(token: number): boolean {
    return token === this.generation;
  }

  invalidate(token?: number): void {
    if (token === undefined || token === this.generation) {
      this.generation += 1;
    }
  }
}
