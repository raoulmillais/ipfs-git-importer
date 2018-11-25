# Prototype of a pure JS ipfs git repository importer

## This is a proof of concept

* Expect force pushes to msater
* Do not rely on the code here

## Issues

* Babel defaults to supporting  <0.25% of brosers when transpiling which 
triggers a bug transpiling `for...of` loops.  This breaks isomorphic-git 
and is not realistic for our scenario.  I have set the config to 
`last 2 chrome versions`.  See [isomorphic-git#588](https://github.com/isomorphic-git/isomorphic-git/issues/588)




