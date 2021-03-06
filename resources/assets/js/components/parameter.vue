<style>
    .meta {
        background: #ccc;
        margin-top: 5px;
    }
    .meta-label {
        color: #626262;
    }
    .panel-title .btn {
        margin-top: -6px;
    }
</style>
<template>
    <div>
        <div :class="['panel',markIfDirty,'no-margin']">
            <div class="panel-heading">
                <h3 class="panel-title">
                    <div>
                        {{originalParameter.label}}
                        <span class="pull-right">
                            <span v-if="isDirty && previewMode" class="label label-warning">
                                Unsaved Changes!
                            </span>
                            <button v-if="isDirty && !previewMode" @click="undoChanges" type="button" class="btn btn-default btn-sm">
                                <i class="fa fa-undo"></i>
                            </button>
                            <button v-if="isDirty && !previewMode" @click="submit" type="button" class="btn btn-default btn-sm">
                                <i class="fa fa-floppy-o"></i>
                            </button>
                            <span class="badge">{{originalParameter.type}}</span>
                            <button @click="togglePreview" type="button" class="btn btn-default btn-sm">
                                <i class="fa fa-pencil"></i>
                            </button>
                            <button @click="removeParameter" type="button" class="btn btn-danger btn-sm">
                                <i class="fa fa-times-circle"></i>
                            </button>
                        </span>
                        &nbsp;
                    </div>
                </h3>
            </div>
            <div class="panel-body">
                <form v-if="originalParameter.type != null" v-on:submit.prevent="submit">
                    <component :parameter="originalParameter" :is="getEditorComponentName" :ref="getEditorComponentRef"></component>
                    <ul class="list-group" v-show="errors.length > 0">
                        <li class="list-group-item list-group-item-danger" v-for="error in errors" v-html="parseError(error)"></li>
                    </ul>
                </form>
            </div>
            <div class="panel-footer">
                <parameter-meta :parameter.sync="originalParameter"></parameter-meta>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                isDirty: false,
                errors: [],
                previewMode: false,
                childComponent: null,
                originalParameter: window.Laravel.parametersColumns,
            }
        },
        props: {
            parameter: {
                default: function() {
                    return window.Laravel.parametersColumns
                }
            }
        },
        mounted() {
            this.originalParameter = this.parameter;

            this.registerEvents();
            this.$nextTick(x => {
                this.childComponent = this.$refs[this.originalParameter.id + 'editor-' + this.originalParameter.type];
            });
        },
        methods: {
            removeParameter(event) {
                var eventConfirmationLevel = event.ctrlKey ? 'confirmed' : 'confirm';

                EventBus.fire(eventConfirmationLevel + '-removeParameter', this.parameter);
            },
            registerEvents() {
                EventBus.listen('value-change-' + this.parameter.id, data => {
                    this.isDirty = data.isDirty;
                    this.errors = [];
                });

                this.$on('file-uploaded', data => {
                    if(this.parameter.type == "file")
                        this.parameterChanged(data.parameter);
                } );

                this.$on('save-change', this.submit );
            },
            submit() {
                if(! this.isDirty)
                    return null;

                this.$http.patch(window.Laravel.base_url + 'parameters/' + this.originalParameter.id, {
                    value: this.childComponent.paramValue
                }).then( response => {
                    this.parameterChanged(response.data);
                }).catch((error) => {
                    var errorMessage = 'Error in updating parameter (' + this.parameter.id + ')';
                    var errorData = error.response.data;
                    if(typeof errorData == "object") {
                        this.errors = _.toArray(errorData);
                    }
                    Helper.checkCommonErrors(errorData, errorMessage);
                });
            },
            parameterChanged(parameter) {
                this.originalParameter = parameter;
                this.$nextTick(x => {
                    this.childComponent.init();
                    this.isDirty = false;
                    if(! this.previewMode)
                        this.togglePreview();
                });
                this.alert('Parameter: ' + parameter.label + ' has been updated successfully');
                EventBus.fire('parameter-updated', parameter);
            },
            togglePreview() {
                this.childComponent.previewMode = !this.childComponent.previewMode ;
                this.previewMode = this.childComponent.previewMode;
            },
            undoChanges() {
                this.childComponent.paramValue = this.childComponent.originalParameter.value;
                this.childComponent.$emit('undo-changes');
                this.childComponent.focusInEditor();
            },
            parseError(error) {
                return error.join(', ');
            }
        },
        computed: {
            getEditorComponentName() {
                return 'editor-' + this.originalParameter.type;
            },
            getEditorComponentRef() {
                return this.originalParameter.id + this.getEditorComponentName;
            },
            markIfDirty() {
                return this.isDirty ? 'panel-warning': 'panel-default';
            }
        }
    }
</script>
