import { useRef } from 'react';
import { toast } from 'react-toastify';
// import { logout } from '@utils';
import Cookies from 'js-cookie';
import { useLocation } from 'react-router-dom';
let lastSelectedId = null;

export const fetchJson = async (url, options = {}) => {
  try {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const token = Cookies.get('_bb_key');
    const sadminId = Cookies.get('authid');

    const authHeaders = (token && token !== "")
      ? {
          token,
          SadminID: sadminId,
        }
      : {};

    options.headers = {
      ...defaultHeaders,
      ...options.headers,
      ...authHeaders,
    };

    const res = await fetch(url, options);

    if (!res.ok) {
      toast.error(`Server error (${res.status})`);
      return { flag: 'F', msg: `Server error (${res.status})` };
    }

    const contentType = res.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      const json = await res.json();

      if (json?.statusCode === 994) {
        toast.error('Session expired. Redirecting to login...');
        setTimeout(() => {
          // logout();
        }, 500);
        return;
      }

      return json;
    } else {
      const raw = await res.text();

      if (raw.includes('<div') || raw.includes('A PHP Error')) {
        console.warn('❌ PHP error received instead of JSON:', raw);
        return { flag: 'F', msg: 'Internal server error. Please contact support.' };
      }

      toast.error('Unexpected server response.');
      return { flag: 'F', msg: 'Unexpected error. Try again later.' };
    }
  } catch (error) {
    console.error('🌐 Network/API error:', error);
    toast.error('Unable to reach the server.');
    return { flag: 'F', msg: 'Unable to connect. Please check your network.' };
  }
};

export const safeSelectHandler = (selectedId, onSelect, item, labelKey = 'categoryName') => {
  if (lastSelectedId === selectedId) return; // 🛑 Prevent duplicate triggers
  lastSelectedId = selectedId;

  const label = item[labelKey] || item.name || '';
  onSelect(selectedId, { label, ...item });
};

export function formatFiltersForAPI(filters) {
  const result = {};

  let rowIndex = 1;

  filters.forEach((filter) => {
    const hasValidColumn = Boolean(filter.columnName || filter.column);
    const hasValidCondition = !!filter.condition;
    const hasValidValue =
      (Array.isArray(filter.value) && filter.value.length > 0) ||
      (!!filter.value?.value || typeof filter.value === 'string' || typeof filter.value === 'number' || typeof filter.value === 'object');
    if (hasValidColumn && hasValidCondition && hasValidValue) {
      result[`row${rowIndex}`] = {
        columnName: filter.columnName ? filter.columnName : filter.column,
        isDynamic: filter.isDynamic,
        fieldObj: filter.defination.fieldID,
        mappedFieldName: filter.mappedFieldName || '',
        condition: filter.condition,
      value: (() => {
  if (filter.condition === 'date_range') {
    const from = formatDate(filter.value?.from);
    const to = formatDate(filter.value?.to);
    return `${from}/${to}`;
  } else if (filter.condition === 'exact_date') {
    return formatDate(filter.value?.from);
  }

  if (Array.isArray(filter.value)) {
    return filter.value
      .map(v => (typeof v === 'object' ? v.value : v))
      .filter(Boolean)
      .join(',');
  }

  return filter.value?.value || filter.value || '';
})(),

        logicalOp: filter.logicalOp || 'AND',
        optionsArray: filter.optionsArray || [],
        valueToShow: (() => {
  if (filter.condition === 'date_range') {
    return `${formatDate(filter.value?.from)}/${formatDate(filter.value?.to)}`;
  } else if (filter.condition === 'exact_date') {
    return formatDate(filter.value?.from);
  }

  if (Array.isArray(filter.value)) {
    return filter.value
      .map(v => (typeof v === 'object' ? v.label : v))
      .filter(Boolean)
      .join(', ');
  }

  return filter.value?.label || String(filter.value || '');
})(),
      };
      rowIndex++;
    }
  });

  return result;
}
export function prepareFilterPayload(filters, editingFilterIndex, updatedRow) {
  const updatedFilters = [...filters];
  updatedFilters[editingFilterIndex] = {
    ...updatedFilters[editingFilterIndex],
    ...updatedRow,
  };
  const payload = formatFiltersForAPI(updatedFilters);
  return {
    updatedFilters,
    payload,
  };
}
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB').split('/').join('-'); // dd-MM-yyyy
}

export function convertServerFilterData(data, availableFields) {
  return Object.values(data).map((row) => {
    const defination = availableFields.find(f => f.Field === row.columnName);
    const value =
      typeof row.value === 'string' && row.value.includes(',') && row.valueToShow
        ? row.value.split(',').map((v, i) => ({
            value: v,
            label: row.valueToShow.split(',')[i] || v
          }))
        : row.valueToShow && typeof row.value !== 'object'
        ? [{ value: row.value, label: row.valueToShow }]
        : row.value;

    return {
      defination,
      column: row.columnName,
      mappedFieldName: row.mappedFieldName,
      condition: row.condition,
      logicalOp: row.logicalOp,
      optionsArray: row.optionsArray || [],
      value,
    };
  });
}

export function useMatchedMenu(ModuleName='') {
  const location = useLocation();
  const baseRoute = ModuleName? ModuleName : location.pathname.split('/')[1];
  let menuData = null;

  try {
    menuData = JSON.parse(localStorage.getItem('appMenu')) || {};
  } catch (e) {
    console.error('Invalid appMenu JSON:', e);
    return null;
  }

  let matchedMenu = null;

  menuData?.data?.forEach(main => {
    if (main.menuLink === baseRoute) {
      matchedMenu = main;
    }
    main.subMenu?.forEach(sub => {
      if (sub.menuLink === baseRoute) {
        matchedMenu = sub;
      }
    });
  });

  return matchedMenu?.menuID;
}

export function useGetMetaData(ModuleName='') {
  const location = useLocation();
  const baseRoute = ModuleName? ModuleName : location.pathname.split('/')[1];
  let menuData = null;

  try {
    menuData = JSON.parse(localStorage.getItem('appMenu')) || {};
  } catch (e) {
    console.error('Invalid appMenu JSON:', e);
    return null;
  }

  let matchedMenu = null;

  menuData?.data?.forEach(main => {
    if (main.menuLink === baseRoute) {
      matchedMenu = main;
    }
    main.subMenu?.forEach(sub => {
      if (sub.menuLink === baseRoute) {
        matchedMenu = sub;
      }
    });
  });

  return matchedMenu?.metadata;
}

export function updateMenuMetadata(menuLink, newMetadata) {
  try {
    const appMenu = JSON.parse(localStorage.getItem('appMenu')) || {};
    let updated = false;

    appMenu?.data?.forEach((main) => {
      if (main.menuLink === menuLink) {
        main.metadata = JSON.stringify(newMetadata); // serialize metadata
        updated = true;
      }
      main.subMenu?.forEach((sub) => {
        if (sub.menuLink === menuLink) {
          sub.metadata = JSON.stringify(newMetadata);
          updated = true;
        }
      });
    });

    if (updated) {
      localStorage.setItem('appMenu', JSON.stringify(appMenu));
      console.log(`Metadata updated for menuLink: ${menuLink}`);
    } else {
      console.warn(`MenuLink not found: ${menuLink}`);
    }
  } catch (e) {
    console.error('Failed to update appMenu metadata:', e);
  }
}

export function useDebouncedCallback(callback, delay) {
  const timeout = useRef();

  return (...args) => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}