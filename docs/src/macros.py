# pylint: disable=unused-variable

def define_env(env):
  "Hook function"

  @env.macro
  def typeURL(obj):

    return "**[`{}`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/{})**".format(obj, obj)

  @env.macro
  def classLink(obj):

    return "**[`{}`](../Classes/{}.md)**".format(obj, obj)

  @env.macro
  def typedefLink(obj):

    return "**[`{}`](../Typedefs/{}.md)**".format(obj, obj)

  @env.macro
  def classArray(obj):

    return "{}`<`{}`>`".format(typeURL("Array"), classLink(obj))

  @env.macro
  def typedefArray(obj):

    return "{}`<`{}`>`".format(typeURL("Array"), typedefLink(obj))

  @env.macro
  def classExtension(obj):

    return '!!! extension "Class Extension"\n    This class **extends** the ' + classLink(obj) + ' class. All properties and/or methods of the parent class are inherited. The parameters extending it are included below.'

  @env.macro
  def interfaceExtension(obj):

    return '!!! extension "Interface Extension"\n    This interface **extends** the ' + typedefLink(obj) + ' interface. All properties and/or methods of the parent interface are inherited. The parameters extending it are included below.'