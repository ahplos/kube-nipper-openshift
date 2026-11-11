import {
    Bullseye,
    Spinner,
    PageSection
} from '@patternfly/react-core';

import NipLogViewer from '../components/NipLogViewer';

export const  NipLogsTab = (model: any) => {
    let bodyContent = <Bullseye><Spinner size='lg' aria-label='Fetching logs...' /></Bullseye>;
    if (model.obj) {
        bodyContent = <NipLogViewer nip={model.obj} />;
    }

    return (
        <PageSection isFilled padding={{ default: 'noPadding' }}>
            {bodyContent}
        </PageSection>
    );
};

export default NipLogsTab;