import {
    useMemo,
    useState
} from 'react';

import {
    Icon,
    Switch,
    ToolbarItem
} from '@patternfly/react-core';
import { SortByDirection } from '@patternfly/react-table';
import {
    DataView,
    DataViewTable,
    DataViewToolbar,
    useDataViewSort
} from '@patternfly/react-data-view';

import {
    ListPageHeader,
    ResourceLink,
    Timestamp,
} from '@openshift-console/dynamic-plugin-sdk';

import RhUiErrorFillIcon from '@patternfly/react-icons/dist/esm/icons/rh-ui-error-fill-icon'

import {
    RESOURCE_NIP_GVK,
    NS_GVK,
    POD_GVK,
} from '../utilities/objectDefs';

import NipK8sUtils from '../utilities/nipK8sUtils';

const NAME_KEY = 'name';
const NAMESPACE_KEY = 'namespace';
const INVOLVED_OBJECT_KEY = 'involvedObject';
const SOURCE_KEY = 'source';
const HAS_ERROR_KEY = 'hasError';
const CREATED_KEY = 'created';

export const NipListPage = (model: { namespace: any; }) => {

    const makeSortProps = (key: string, columnIndex: number) => ({
        sortBy: {
            index: columnIndex,
            direction: sortBy === key ? direction : undefined
        },
        onSort: (
            _event: React.MouseEvent,
            _columnIndex: number,
            direction: SortByDirection
        ) => {
            onSort(_event, key, direction);
        },
        columnIndex,
    });

    const [nips, _, __] = NipK8sUtils.getResourceNips({namespace: model.namespace});

    const [isChecked, setIsChecked] = useState<boolean>(false);
    const filteredNips = isChecked ? nips : nips.filter(nip =>
        nip.source != 'resourceDeleted' || nip.involvedObject.status?.phase != 'Succeeded'
    );

    const handleChange = (_event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
        setIsChecked(checked);
    };

    const { sortBy, direction, onSort } = useDataViewSort({
        initialSort: {
            sortBy: 'name',
            direction: 'asc',
        },
    });

    const columns = [
        {
            cell: 'Name',
            props: {
                sort: makeSortProps(NAME_KEY, 0),
                isStickyColumn: true
            },
        },
        {
            cell: 'Namespace',
            props: {
                sort: makeSortProps(NAMESPACE_KEY, 1),
            },
        },
        {
            cell: 'Involved Object',
            props: {
                sort: makeSortProps(INVOLVED_OBJECT_KEY, 2),
            },
        },
        {
            cell: 'Source',
            props: {
                sort: makeSortProps(SOURCE_KEY, 3),
            },
        },
        {
            cell: 'Has Error',
            props: {
                sort: makeSortProps(HAS_ERROR_KEY, 4),
            },
        },
        {
            cell: 'Created',
            props: {
                sort: makeSortProps(CREATED_KEY, 5),
            },
        },
    ];

    const sortedData = useMemo(() => {
        const sorted = [...filteredNips];

        sorted.sort((a, b) => {
            let aVal = '';
            let bVal = '';

            switch(sortBy) {
                case NAME_KEY:
                    aVal = a.metadata?.name || ''
                    bVal = b.metadata?.name || ''
                    break;
                case NAMESPACE_KEY:
                    aVal = a.metadata?.namespace || ''
                    bVal = b.metadata?.namespace || ''
                    break;
                case INVOLVED_OBJECT_KEY:
                    aVal = a.involvedObject.metadata.namespace + ' ' + a.involvedObject.metadata.name
                    bVal = b.involvedObject.metadata.namespace + ' ' + b.involvedObject.metadata.name
                    break;
                case SOURCE_KEY:
                    aVal = a.source
                    bVal = b.source
                    break;
                case HAS_ERROR_KEY:
                    aVal = (a.source != 'resourceDeleted' || a.involvedObject.status?.phase != 'Succeeded') ? '1' : '0'
                    bVal = (b.source != 'resourceDeleted' || b.involvedObject.status?.phase != 'Succeeded') ? '1' : '0'
                    break;
                case CREATED_KEY:
                    aVal = a.metadata?.creationTimestamp || ''
                    bVal = b.metadata?.creationTimestamp || ''
                break;
            }

            const cmp = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });
            return direction === 'asc' ? cmp : -cmp;
        });

        return sorted;
    }, [filteredNips, sortBy, direction]);

    const rows = sortedData.map((nip) => ({
        id: nip.metadata?.uid,
        row: [
            {
                cell: <ResourceLink groupVersionKind={RESOURCE_NIP_GVK}
                                    name={nip.metadata?.name}
                                    namespace={nip.metadata?.namespace}/>,
                props: {
                    hasRightBorder: true,
                    isStickyColumn: true
                }
            },
            <ResourceLink groupVersionKind={NS_GVK}
                          name={nip.metadata?.namespace}/>,
            <ResourceLink groupVersionKind={POD_GVK}
                          name={nip.involvedObject.metadata.name as string}
                          namespace={nip.involvedObject.metadata.namespace as string}/>,
            nip.source,
            (nip.involvedObject.status?.phase && nip.involvedObject.status.phase != 'Succeeded') &&
                <Icon status="danger"><RhUiErrorFillIcon/></Icon>,
            <Timestamp timestamp={nip.metadata?.creationTimestamp || '-'} />
        ]
    }));

    return (
        <>
            <ListPageHeader title={'Ahplos ResourceNips'}/>
            <DataView>
                <DataViewToolbar>
                    <ToolbarItem align={{ default: 'alignEnd' }}>
                        <Switch
                            id="show-nominal"
                            label="Show Nominal"
                            isChecked={isChecked}
                            onChange={handleChange}
                        />
                    </ToolbarItem>
                </DataViewToolbar>
                <DataViewTable
                    aria-label="Resource Nips"
                    columns={columns}
                    rows={rows}
                    isSticky
                />
            </DataView>
        </>
    );
};

export default NipListPage;