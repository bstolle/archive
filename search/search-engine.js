import { fitsNested, compareFit, parseQuery } from "./util.js"

export class SearchEngine {
	constructor() {
		this._collection = []
		this.filteredCollection = []
		this.filters = []
		this.resetFilter()
		this.resetFilterModel()
		this.resetSorting()
		this.resetSortingModel()
		this.reverseSort = false
	}

	set collection(value) {
		this._collection = value
		this.updateFilteredCollection()
	}

	get collection() {
		return this._collection
	}

	resetFilter() {
		this.filter = { type: "", query: "" }
	}

	resetSorting() {
		this.sorting = "bestfit"
	}

	resetFilterModel() {
		this.filterModel = { "": new FilterType("Anything", "", [], false, fitsNested) }
	}

	setFilterModelFromExample(source) {
		this.resetFilterModel()
		for (var key in source) {
			if (source[key] === true || source[key] === false)
				this.filterModel[key] = new FilterType(key, key, ["true", "false"], true)
			else
				this.filterModel[key] = new FilterType(key, key)
		}
	}

	resetSortingModel() {
		this.sortingModel = { "bestfit": new SortingType("Best Fit", "", compareFit), "": new SortingType("Original", "original") }
	}

	setSortingModelFromExample(source) {
		this.resetSortingModel()
		for (var key in source)
			this.sortingModel[key] = new SortingType(key, key)
	}

	setModelFromCollection() {
		if (this.collection.length == 0)
			return
		this.setFilterModelFromExample(this.collection[0])
		this.setSortingModelFromExample(this.collection[0])
	}

	addCurrentFilter() {
		this.filters.push(this.filter)
		this.filter = { type: "", query: "" }
	}

	updateFilteredCollection() {
		this.filteredCollection = this.search()
	}

	search() {
		var list = []
		for (let i in this.collection)
			list[i] = this.collection[i]
		for (let filter of this.filters)
			list = this.applyFilter(list, filter)
		list = this.applyFilter(list, this.filter)
		if (this.sorting)
			list.sort(this.sortingModel[this.sorting].compare)
		if (this.reverseSort)
			list.reverse()
		return list
	}

	applyFilter(list, filter) {
		var filterType = this.filterModel[filter.type] || this.filterModel[""]
		return list.filter(e => filterType.fits(e, filter.query))
	}

	filterTitle(filter) {
		return (this.filterModel[filter.type] || this.filterModel[""]).title
	}

	currentFilterType() {
		return this.filterModel[this.filter.type] || this.filterModel[""]
	}

	currentParsedQuery() {
		return parseQuery(this.filter.query)
	}

	setCurrentQueryFrom(parsedQuery) {
		this.filter.query = parsedQuery.map(e => e.type + e.query).join("|")
	}
}

export class FilterType {
	constructor(title, key, options = [], restrictToOptions = false, fits = null) {
		this.title = title
		this.key = key
		this.options = options
		this.restrictToOptions = restrictToOptions
		this.fits = fits || ((m, q) => fitsNested(m[this.key], q))
	}
}

export class SortingType {
	constructor(title, key, compare = null) {
		this.title = title
		this.key = key
		this.compare = compare || ((a, b) => a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0)
	}
}