describe("Demo page", () => {
  it("Shows a modal with close button", () => {
    cy.visit("http://localhost:8000");
    cy.contains("show").click();
    cy.get(".vv-close").should("exist").click();
  });
});
