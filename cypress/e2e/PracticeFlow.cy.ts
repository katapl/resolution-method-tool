// cypress/e2e/practice_flow.cy.js

describe('Interactive Practice Flow (Sandbox)', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('should allow user to manually resolve clauses on the canvas', () => {
        cy.get('textarea').type('A, ~A');

        cy.contains('button', 'Practice').click();

        cy.contains('Select a literal').should('be.visible');

        cy.contains('button', /^A$/).click();

        cy.contains('Resolving on').should('be.visible');

        cy.get('.react-flow__node').should('have.length', 2).as('nodes');

        cy.get('@nodes').eq(0).click();
        cy.get('@nodes').eq(1).click();

        cy.get('.react-flow__node').should('have.length', 3);

        cy.contains('Empty clause found!').should('be.visible');
    });
});