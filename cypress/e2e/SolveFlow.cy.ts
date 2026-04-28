// cypress/e2e/solve_flow.cy.js

describe('Automated Solve Flow', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('should calculate proof, navigate to end, and expand the result panel', () => {
        cy.get('textarea').type('A v B |- A');
        cy.contains('button', 'Solve').click();

        cy.contains('Step 1').should('be.visible');

        const clickNextUntilEnd = () => {
            cy.get('body').then(($body) => {
                const $btn = $body.find('[data-cy="next-step-btn"]');

                if ($btn.length && !$btn.is(':disabled')) {
                    cy.wrap($btn).click();

                    cy.wait(50).then(() => clickNextUntilEnd());
                }
            });
        };

        clickNextUntilEnd();

        cy.contains('Step').should('be.visible');

        cy.get('[data-cy="result-expand-btn"]').should('be.visible').click();

        cy.contains('Reached').should('be.visible');
    });
});