		<style scoped>

		</style>
		<template>
			<div class="">
				<div class="list-group">
					<button type="button"
						v-for="category in categories"
						v-if="!category.isCategoriesGroup"
						@click="choseCategory(category)"
						:class="['list-group-item', paramBelongsToCategory(category) ? 'list-group-item-success':'']">
						<i :class="['fa', paramBelongsToCategory(category) ? 'fa-check-square-o': 'fa-square-o']"></i>
						{{category.title}}
					</button>
					<div class="list-group-item">
						<add-category></add-category>
					</div>
				</div>
			</div>
		</template>

		<script>
			export default {
				data() {
					return {
			            parameter: window.Laravel.parametersColumns,
		                categories: [],
		                isBusy: false,
					}
				},
		        props: {

		        },
		        methods: {
		        	init() {
		        		this.registerEvents();
		        	},
		        	registerEvents() {
		        		EventBus.listen('update-categories', this.updateCategories);
		        	},
		        	updateCategories(categories) {
		        		this.categories = categories;
		        	},
					paramBelongsToCategory(category) {
						var paramCategoryId = this.parameter.category_id;

						paramCategoryId = paramCategoryId == null ? "": paramCategoryId;

						return paramCategoryId == category.target;
					},
					choseCategory(category) {
						if(this.paramBelongsToCategory(category))
							return ;

						if(this.isBusy)
							return this.alert('Wait until the previous request processed..', 'danger');

						this.isBusy = true;

						EventBus.fire('chose-paramCategory', {
							parameter: this.parameter.id,
							category: category.target
						});
					}
		        },
				mounted() {
					EventBus.listen('changed-paramCategory', data => {
						this.isBusy = false;
						if(! data.ok)
							return ;

						this.parameter = data.parameter;						
					});
					EventBus.listen('start-addCategory', x=> {
						this.isBusy = true;
					});
					EventBus.listen('end-addCategory', x=> {
						this.isBusy = false;
					});
				},
				computed: {
				}
			}
		</script>