export class Project {
  public id: string;
  public name: string;
  public description: string;
  public createdAt: string;
  public updatedAt: string;

  constructor(
    id: string,
    name: string,
    description: string,
    createdAt: string,
    updatedAt: string,
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
