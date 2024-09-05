const SubCategory = require('../models/subCategoryModel');
const factory = require('./handlerFactory');

/*
 when creating a subcategory on a specif category using nested routes there will be error due to the validator 
 where the category is required so this is a function to set the req.body.category 
 */

exports.setCategoryIdToBody = (req, res, next) => {
  if (!req.body.category) req.body.category = req.params.categoryId;
  next();
};

//  route:  GET api/v1/SubCategories
//  access  public
exports.getAllSubCategories = factory.getAll(SubCategory);

//  route:  POST api/v1/SubCategories
//  access  admin
exports.createSubCategory = factory.createOne(SubCategory);

//  route:  PATCH api/v1/SubCategories/id
//  access  admin
exports.updateSubCategory = factory.updateOne(SubCategory);

//  route:  GET api/v1/SubCategories/id  id = df21dsf2sd1fsdf5sdf1sdf5
//  access  public
exports.getSubCategory = factory.getOne(SubCategory);

//  route:  DELETE api/v1/SubCategories/id
//  access  admin
exports.deleteSubCategory = factory.deleteOne(SubCategory);
