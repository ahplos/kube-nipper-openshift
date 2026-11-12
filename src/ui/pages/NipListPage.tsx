import {
    useMemo,
    useState
} from 'react';
import { useSearchParams } from 'react-router-dom-v5-compat';

import {
    Icon,
    Pagination,
    Switch,
    ToolbarItem
} from '@patternfly/react-core';
import { SortByDirection } from '@patternfly/react-table';
import {
    DataView,
    DataViewFilters,
    DataViewTable,
    DataViewTextFilter,
    DataViewToolbar,
    useDataViewFilters,
    useDataViewPagination,
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

    const makeSortProps = (columnName: string, columnIndex: number) => ({
        sortBy: {
            index: columnIndex,
            direction: sortBy === columnName ? direction : undefined
        },
        onSort: (
            _event: React.MouseEvent,
            _columnIndex: number,
            direction: SortByDirection
        ) => { onSort(_event, columnName, direction); },
        columnIndex,
    });

    const [nips, _, __] = NipK8sUtils.getResourceNips({namespace: model.namespace});
    interface NipFilter {
        name: string;
        source: string;
    }
    const [ searchParams, setSearchParams ] = useSearchParams();
    const { filters, onSetFilters } = useDataViewFilters<NipFilter>({
        initialFilters: { name: '', source: '' },
        searchParams,
        setSearchParams,
    });

    const [isChecked, setIsChecked] = useState<boolean>(false);
    const nominalOrAllNips = isChecked ? nips : nips.filter(nip =>
        nip.source != 'resourceDeleted' || nip.involvedObject.status?.phase != 'Succeeded'
    );

    const filteredNips = useMemo(() => nominalOrAllNips.filter((item) => {
            const nipName = item.metadata?.name ?? '';
            const nipSource = item.source ?? '';
            return (!filters.name || nipName.toLowerCase().includes(filters.name.toLowerCase())) &&
                   (!filters.source || nipSource.toLowerCase().includes(filters.source.toLowerCase()));
        }),
        [nominalOrAllNips, filters.name],
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


    const pagination = useDataViewPagination({ perPage: 10 });
    const { page, perPage } = pagination;

    const rows = sortedData.slice((page - 1) * perPage, page * perPage).map((nip) => ({
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
                <DataViewToolbar
                    filters= {
                        <DataViewFilters values={filters} onChange={(_e, values) => onSetFilters(values)}>
                            <DataViewTextFilter filterId="name" title="Name" placeholder="ResourceNip name"/>
                            <DataViewTextFilter filterId="source" title="Source" placeholder="ResourceNip source"/>
                        </DataViewFilters>
                    }
                >
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
                <DataViewToolbar pagination={<Pagination itemCount={filteredNips.length} {...pagination} />} />
            </DataView>
        </>
    );
};

export default NipListPage;