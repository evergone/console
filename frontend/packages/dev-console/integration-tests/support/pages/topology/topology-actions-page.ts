import { modal } from '@console/cypress-integration-tests/views/modal';
import { nodeActions } from '../../constants';

export const topologyActions = {
  selectAction: (action: nodeActions | string) => {
    switch (action) {
      case 'Edit Application Grouping':
      case nodeActions.EditApplicationGrouping: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case 'Edit Pod Count':
      case nodeActions.EditPodCount: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case 'Edit Labels':
      case nodeActions.EditLabels: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        cy.get('form').should('be.visible');
        modal.modalTitleShouldContain('Edit Labels');
        break;
      }
      case 'Edit Annotations':
      case nodeActions.EditAnnotations: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        cy.get('form').should('be.visible');
        modal.modalTitleShouldContain('Edit Annotations');
        break;
      }
      case 'Edit Update Strategy':
      case nodeActions.EditUpdateStrategy: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case 'Delete Deployment':
      case nodeActions.DeleteDeployment: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case 'Delete SinkBinding':
      case nodeActions.DeleteSinkBinding: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case 'Edit SinkBinding':
      case nodeActions.EditSinkBinding: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case 'Move Sink':
      case nodeActions.MoveSink: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case 'Delete Service':
      case nodeActions.DeleteService: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      default: {
        throw new Error(`${action} is not available in action menu`);
      }
    }
  },
};
