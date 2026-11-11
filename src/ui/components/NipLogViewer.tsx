import * as React from 'react';

import {
    Button,
    Divider,
    Flex,
    FlexItem,
    Switch,
    TextInput,
} from '@patternfly/react-core';

import CompressIcon from '@patternfly/react-icons/dist/dynamic/icons/compress-icon';
import CopyIcon from '@patternfly/react-icons/dist/dynamic/icons/copy-icon';
import ExpandIcon from '@patternfly/react-icons/dist/dynamic/icons/expand-icon';

import {
    LogViewer,
    LogViewerSearch,
} from '@patternfly/react-log-viewer';

import {
    ResourceNip,
} from '../utilities/objectDefs';

interface ResourceNipProps {
    nip: ResourceNip,
};

export const NipLogViewer = ( model : ResourceNipProps) => {
    const nip = model.nip;

    const [isLinesWrapped, setLinesWrapped] = React.useState<boolean>(true);
    const [isShowLineNumbers, setShowLineNumbers] = React.useState<boolean>(true);
    const [isFullScreen, setFullScreen] = React.useState<boolean>(false);

    const showLineNumbers = (event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
        setShowLineNumbers(checked);
    }

    const changeLinesWrapped = (event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
        setLinesWrapped(checked);
    }

    const clickExpandCollapse = (event: React.MouseEvent<HTMLButtonElement>) => {
        setFullScreen(!isFullScreen);

        const element = document.querySelector('#' + nip.metadata?.name);
        isFullScreen ? document.exitFullscreen() : element?.requestFullscreen();
    }

    const LogToolbar = () => {
        return (
            <Flex columnGap={{ default: 'columnGapMd' }}>
                <FlexItem>
                    <LogViewerSearch minSearchChars={3} placeholder='Search term'/>
                </FlexItem>
                <FlexItem>
                    <Switch
                        id='nip-log-viewer-show-line-numbers'
                        label='Line Numbers'
                        isChecked={isShowLineNumbers}
                        onChange={showLineNumbers}
                        ouiaId='BasicSwitch'
                    />
                </FlexItem>
                <FlexItem >
                    <Switch
                        id='nip-log-viewer-totalLines-wrapped'
                        label='Wrap Lines'
                        isChecked={isLinesWrapped}
                        onChange={changeLinesWrapped}
                        ouiaId='BasicSwitch'
                    />
                </FlexItem>
                <FlexItem align={{ default: 'alignRight' }}>
                    <Button onClick={() => navigator.clipboard.writeText(nip.containerLogs[0].logs)} variant='link' icon={<CopyIcon />}>
                        Copy to Clipboard
                    </Button>
                </FlexItem>
                <Divider orientation={{ default: 'vertical' }} />
                <FlexItem>
                    <Button onClick={clickExpandCollapse} variant='link' icon={isFullScreen ? <CompressIcon /> : <ExpandIcon />}>
                        {isFullScreen ? 'Collapse' : 'Expand'}
                    </Button>
                </FlexItem>
            </Flex>
        );
    };

    const LogHeader = () => {
        let totalLines = (nip.containerLogs[0].logs?.match(/\n/g) || '')?.length + 1;
        return (
            <Flex>
                <Flex>
                    <FlexItem>
                        <TextInput
                            aria-label="total-lines"
                            readOnlyVariant="plain"
                            value={totalLines + " Total Lines"}
                        />
                    </FlexItem>
                </Flex>
            </Flex>
        );
    }

    return (
        <FlexItem id={nip.metadata?.name}>
            <LogViewer
                footer={<LogHeader />}
                toolbar={<LogToolbar />}
                hasLineNumbers={isShowLineNumbers}
                isTextWrapped={isLinesWrapped}
                data={nip.containerLogs[0].logs}
                height={isFullScreen ? "calc(95vh)" : "calc(75vh)"}
            />
        </FlexItem>
    );
};

export default NipLogViewer;